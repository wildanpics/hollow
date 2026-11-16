const fs = require("fs");
const path = require("path");
const { ChannelType, PermissionFlagsBits } = require("discord.js");
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState
} = require("@discordjs/voice");
const VERIFICATION_CONFIG = require("../config/verification");
const {
  getQueue,
  getCurrentSession,
  getMemberPosition,
  enqueueMember,
  dequeueNext,
  peekNext,
  removeMember,
  setCurrentSession,
  clearCurrentSession,
  recordHistory
} = require("../storage/verificationQueue");

// In-memory worker locks: guildId => boolean
const workerLocks = new Set();

// Active session abort controllers: guildId => { abort(reason), tempChannelId, userId, survivorTag }
const activeControllers = new Map();

/**
 * Checks whether a member has the SURVIVOR role
 */
function hasSurvivorRole(member) {
  if (!member || !member.roles) return false;
  return member.roles.cache.has(VERIFICATION_CONFIG.SURVIVOR_ROLE_ID);
}

/**
 * Trigger queue processing for a guild if not currently running
 */
function triggerQueueProcessing(guild) {
  if (!guild) return;
  if (workerLocks.has(guild.id)) {
    return; // Already working
  }
  processGuildQueue(guild).catch(err => {
    console.error(`[VoiceVerification] Error tak terduga pada worker ${guild.id}:`, err);
    workerLocks.delete(guild.id);
  });
}

/**
 * Worker loop: Processes one queued member at a time per guild
 */
async function processGuildQueue(guild) {
  if (workerLocks.has(guild.id)) return;
  workerLocks.add(guild.id);

  console.log(`[VoiceVerification] Worker aktif untuk guild ${guild.name} (${guild.id})`);

  try {
    while (true) {
      const nextCandidate = peekNext(guild.id);
      if (!nextCandidate) {
        break; // Queue is empty
      }

      // Dequeue item
      const item = dequeueNext(guild.id);
      if (!item) break;

      // 1. Fetch fresh guild member
      let member;
      try {
        member = await guild.members.fetch(item.userId);
      } catch (err) {
        console.log(`[VoiceVerification] Member ${item.userId} tidak ditemukan di server (mungkin sudah keluar). Melewati.`);
        continue;
      }

      // 2. Validate member eligibility
      if (hasSurvivorRole(member)) {
        console.log(`[VoiceVerification] Member ${member.user.tag} sudah memiliki role SURVIVOR. Melewati.`);
        continue;
      }

      // 3. Confirm member is still inside the Waiting Room
      const currentVoice = member.voice?.channel;
      if (!currentVoice || currentVoice.id !== VERIFICATION_CONFIG.WAITING_ROOM_ID) {
        console.log(`[VoiceVerification] Member ${member.user.tag} sudah tidak berada di Waiting Room. Membatalkan giliran.`);
        continue;
      }

      // 4. Run verification session
      try {
        await executeVerificationSession(guild, member, item);
      } catch (sessionErr) {
        console.error(`[VoiceVerification] Sesi verifikasi gagal untuk ${member.user.tag}:`, sessionErr.message);
      }

      // Cooldown buffer between members (1.5 seconds)
      await new Promise(r => setTimeout(r, 1500));
    }
  } finally {
    workerLocks.delete(guild.id);
    console.log(`[VoiceVerification] Worker selesai untuk guild ${guild.name}`);
  }
}

/**
 * Executes a single verification session:
 * 1. Create temporary private room
 * 2. Move member into room
 * 3. Connect bot & play Emperor audio
 * 4. Verify completion
 * 5. Grant SURVIVOR role
 * 6. Disconnect & cleanup
 */
async function executeVerificationSession(guild, member, queueItem) {
  const survivorTag = queueItem.survivorTag || `HB-${String(guild.memberCount || 1).padStart(4, "0")}`;
  const channelName = `🔒 identity-${survivorTag.toLowerCase()}`;

  console.log(`[VoiceVerification] Memulai sesi verifikasi untuk ${member.user.tag} [${survivorTag}]`);

  // Locate Waiting Room to inherit parent category
  const waitingRoom = guild.channels.cache.get(VERIFICATION_CONFIG.WAITING_ROOM_ID) ||
    await guild.channels.fetch(VERIFICATION_CONFIG.WAITING_ROOM_ID).catch(() => null);

  const parentId = waitingRoom ? waitingRoom.parentId : null;

  // 1. Create Temporary Voice Channel
  let tempChannel;
  try {
    tempChannel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildVoice,
      parent: parentId,
      permissionOverwrites: [
        {
          id: guild.roles.everyone.id,
          deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect]
        },
        {
          id: member.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.Connect,
            PermissionFlagsBits.Speak
          ]
        },
        {
          id: guild.client.user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.Connect,
            PermissionFlagsBits.Speak,
            PermissionFlagsBits.MoveMembers,
            PermissionFlagsBits.ManageChannels
          ]
        }
      ],
      reason: `HOLLOWBORN Emperor Voice Verification Room for ${member.user.tag} [${survivorTag}]`
    });
  } catch (err) {
    recordHistory(guild.id, {
      userId: member.id,
      survivorTag,
      status: "FAILED_CHANNEL_CREATION",
      error: err.message
    });
    throw new Error(`Gagal membuat channel verifikasi sementara: ${err.message}`);
  }

  // Update persistent current session
  setCurrentSession(guild.id, {
    userId: member.id,
    userTag: member.user.tag,
    survivorTag,
    tempChannelId: tempChannel.id,
    startedAt: Date.now()
  });

  let connection = null;
  let player = null;
  let isAborted = false;
  let abortReason = "";
  let playbackSucceeded = false;

  // Setup abort controller
  const abortSession = (reason = "Cancelled") => {
    if (isAborted) return;
    isAborted = true;
    abortReason = reason;
    console.log(`[VoiceVerification] Sesi ${survivorTag} dibatalkan: ${reason}`);
    if (player) {
      try { player.stop(true); } catch (_) {}
    }
  };

  activeControllers.set(guild.id, {
    abort: abortSession,
    tempChannelId: tempChannel.id,
    userId: member.id,
    survivorTag
  });

  try {
    // 2. Move member to temp voice channel
    try {
      await member.voice.setChannel(tempChannel);
      console.log(`[VoiceVerification] ${member.user.tag} dipindahkan ke ${channelName}`);
    } catch (moveErr) {
      abortSession("Gagal memindahkan member ke channel verifikasi");
      throw moveErr;
    }

    // Short pause for Discord gateway to register voice state transition
    await new Promise(r => setTimeout(r, 600));

    // Confirm member is in the temp channel
    const freshMemberCheck = await guild.members.fetch(member.id).catch(() => null);
    if (!freshMemberCheck || freshMemberCheck.voice?.channelId !== tempChannel.id) {
      abortSession("Member tidak masuk atau langsung keluar dari channel verifikasi");
      throw new Error("Member tidak terdeteksi di channel verifikasi.");
    }

    // 3. Connect bot to temp channel
    connection = joinVoiceChannel({
      channelId: tempChannel.id,
      guildId: guild.id,
      adapterCreator: guild.voiceAdapterCreator,
      selfDeaf: false,
      selfMute: false
    });

    // Wait for connection ready (up to 10s)
    await entersState(connection, VoiceConnectionStatus.Ready, 10000);

    // 4. Create Audio Player and Resource
    if (!fs.existsSync(VERIFICATION_CONFIG.EMPEROR_AUDIO_PATH)) {
      throw new Error(`File audio tidak ditemukan di: ${VERIFICATION_CONFIG.EMPEROR_AUDIO_PATH}`);
    }

    player = createAudioPlayer();
    const resource = createAudioResource(VERIFICATION_CONFIG.EMPEROR_AUDIO_PATH);
    connection.subscribe(player);

    let hasStartedPlaying = false;

    // 5. Play audio with strict state transitions
    await new Promise((resolve, reject) => {
      const timeoutTimer = setTimeout(() => {
        cleanup();
        reject(new Error("Audio playback melebihi batas waktu (timeout)."));
      }, VERIFICATION_CONFIG.PLAYBACK_TIMEOUT_MS);

      const stateChangeHandler = (oldState, newState) => {
        if (isAborted) {
          cleanup();
          return reject(new Error(`Sesi dibatalkan: ${abortReason}`));
        }

        if (newState.status === AudioPlayerStatus.Playing) {
          hasStartedPlaying = true;
          console.log(`[VoiceVerification] Audio Emperor mulai diputar untuk ${member.user.tag}`);
        } else if (hasStartedPlaying && newState.status === AudioPlayerStatus.Idle) {
          // Playback completed normally from Playing -> Idle
          playbackSucceeded = true;
          cleanup();
          resolve();
        }
      };

      const errorHandler = (error) => {
        cleanup();
        reject(error);
      };

      const connStateHandler = (_, newConnState) => {
        if (
          newConnState.status === VoiceConnectionStatus.Disconnected ||
          newConnState.status === VoiceConnectionStatus.Destroyed
        ) {
          cleanup();
          reject(new Error("Koneksi suara bot terputus selama pemutaran audio."));
        }
      };

      function cleanup() {
        clearTimeout(timeoutTimer);
        player.off("stateChange", stateChangeHandler);
        player.off("error", errorHandler);
        connection.off("stateChange", connStateHandler);
      }

      player.on("stateChange", stateChangeHandler);
      player.on("error", errorHandler);
      connection.on("stateChange", connStateHandler);

      player.play(resource);
    });

    // 6. Audio completed! Validate final member state
    if (isAborted || !playbackSucceeded) {
      throw new Error(`Audio tidak selesai secara normal (${abortReason || "Playback interrupted"}).`);
    }

    // Refresh member state to ensure they didn't disconnect right at the end
    const verifiedMember = await guild.members.fetch(member.id).catch(() => null);
    if (!verifiedMember || verifiedMember.voice?.channelId !== tempChannel.id) {
      throw new Error("Member terputus dari voice sebelum verifikasi role diberikan.");
    }

    // 7. Assign SURVIVOR role
    const survivorRole = guild.roles.cache.get(VERIFICATION_CONFIG.SURVIVOR_ROLE_ID) ||
      await guild.roles.fetch(VERIFICATION_CONFIG.SURVIVOR_ROLE_ID).catch(() => null);

    if (!survivorRole) {
      throw new Error(`Role SURVIVOR (${VERIFICATION_CONFIG.SURVIVOR_ROLE_ID}) tidak ditemukan di server.`);
    }

    await verifiedMember.roles.add(survivorRole, "HOLLOWBORN — Emperor Voice Verification Complete");
    console.log(`[VoiceVerification] Role SURVIVOR berhasil diberikan ke ${verifiedMember.user.tag}`);

    // Disconnect member gracefully
    await verifiedMember.voice.disconnect("Voice Verification Successful").catch(() => {});

    // Record success
    recordHistory(guild.id, {
      userId: verifiedMember.id,
      userTag: verifiedMember.user.tag,
      survivorTag,
      status: "SUCCESS"
    });

    // Send confirmation in arrival/lobby channel if available
    try {
      const arrivalChannel = guild.channels.cache.find(c =>
        c.isTextBased() && (c.name.includes("arrival") || c.name.includes("general") || c.name.includes("welcome"))
      );
      if (arrivalChannel) {
        await arrivalChannel.send({
          content: `🎖️ **IDENTITY RECOGNIZED:** Survivor <@${verifiedMember.id}> [**${survivorTag}**] telah berhasil melewati verifikasi suara Emperor dan resmi menjadi **SURVIVOR**!`
        }).catch(() => {});
      }
    } catch (_) {}

  } finally {
    // 8. Safe Cleanup
    activeControllers.delete(guild.id);
    clearCurrentSession(guild.id);

    if (player) {
      try { player.stop(true); } catch (_) {}
    }
    if (connection) {
      try { connection.destroy(); } catch (_) {}
    }
    if (tempChannel) {
      try {
        await tempChannel.delete("Voice verification session complete or cleaned up.");
        console.log(`[VoiceVerification] Channel sementara ${channelName} berhasil dihapus.`);
      } catch (delErr) {
        console.error(`[VoiceVerification] Gagal menghapus channel ${channelName}:`, delErr.message);
      }
    }
  }
}

/**
 * Handle member entering Waiting Room
 */
function handleWaitingRoomJoin(member) {
  if (!member || member.user?.bot) return;

  // Check if member already has SURVIVOR role
  if (hasSurvivorRole(member)) {
    console.log(`[VoiceVerification] ${member.user.tag} masuk Waiting Room tetapi sudah memiliki role SURVIVOR.`);
    return;
  }

  const result = enqueueMember(member.guild.id, member);
  if (result.enqueued) {
    console.log(`[VoiceVerification] ${member.user.tag} masuk antrean verifikasi posisi #${result.position} [${result.item.survivorTag}]`);
  } else {
    console.log(`[VoiceVerification] ${member.user.tag} sudah ada dalam antrean posisi #${result.position}`);
  }

  // Trigger worker
  triggerQueueProcessing(member.guild);
}

/**
 * Handle member leaving Waiting Room
 */
function handleWaitingRoomLeave(member) {
  if (!member || member.user?.bot) return;

  const removed = removeMember(member.guild.id, member.id);
  if (removed) {
    console.log(`[VoiceVerification] ${member.user.tag} meninggalkan Waiting Room, dihapus dari antrean.`);
  }
}

/**
 * Handle member leaving temporary verification room mid-session
 */
function handleTempRoomLeave(member, leftChannelId) {
  if (!member || member.user?.bot) return;

  const controller = activeControllers.get(member.guild.id);
  if (controller && controller.tempChannelId === leftChannelId && controller.userId === member.id) {
    console.log(`[VoiceVerification] ${member.user.tag} keluar dari channel verifikasi saat sesi sedang berjalan!`);
    controller.abort("Member disconnected from verification room");
  }
}

/**
 * Cancel active session forcibly (Admin control)
 */
function cancelActiveSession(guildId, reason = "Admin Cancelled") {
  const controller = activeControllers.get(guildId);
  if (controller) {
    controller.abort(reason);
    return true;
  }
  return false;
}

/**
 * Restart Recovery:
 * 1. Clean up orphaned temporary identity rooms
 * 2. Clear stale session markers
 * 3. Scan Waiting Room for eligible members and enqueue them
 * 4. Resume queue processing
 */
async function initVoiceVerificationRecovery(client) {
  console.log("[VoiceVerification] Memulai rekonsiliasi dan pemulihan sistem verifikasi suara...");

  for (const [guildId, guild] of client.guilds.cache) {
    try {
      // 1. Clean up orphaned temporary channels
      const channels = await guild.channels.fetch().catch(() => guild.channels.cache);
      for (const [_, channel] of channels) {
        if (
          channel &&
          channel.type === ChannelType.GuildVoice &&
          channel.name &&
          channel.name.startsWith(VERIFICATION_CONFIG.TEMP_CHANNEL_PREFIX)
        ) {
          console.log(`[VoiceVerification] Menghapus orphan temporary channel sisa restart: ${channel.name} (${channel.id})`);
          await channel.delete("Startup Orphan Cleanup").catch(() => {});
        }
      }

      // 2. Clear stale current session in persistent storage
      clearCurrentSession(guildId);

      // 3. Reconcile Waiting Room members
      const waitingRoom = guild.channels.cache.get(VERIFICATION_CONFIG.WAITING_ROOM_ID) ||
        await guild.channels.fetch(VERIFICATION_CONFIG.WAITING_ROOM_ID).catch(() => null);

      if (waitingRoom && waitingRoom.members) {
        for (const [_, member] of waitingRoom.members) {
          if (!member.user?.bot && !hasSurvivorRole(member)) {
            enqueueMember(guildId, member);
            console.log(`[VoiceVerification] Menambahkan kembali member ${member.user.tag} yang sedang menunggu di Waiting Room.`);
          }
        }
      }

      // 4. Trigger processing
      triggerQueueProcessing(guild);
    } catch (err) {
      console.error(`[VoiceVerification] Gagal rekonsiliasi untuk guild ${guildId}:`, err.message);
    }
  }

  console.log("[VoiceVerification] Rekonsiliasi sistem verifikasi selesai.");
}

module.exports = {
  hasSurvivorRole,
  triggerQueueProcessing,
  handleWaitingRoomJoin,
  handleWaitingRoomLeave,
  handleTempRoomLeave,
  cancelActiveSession,
  initVoiceVerificationRecovery
};
