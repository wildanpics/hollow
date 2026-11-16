const { Events } = require("discord.js");
const {
  handleVoiceJoin,
  handleVoiceLeave,
  handleVoiceSwitch
} = require("../storage/voiceStorage");
const VERIFICATION_CONFIG = require("../config/verification");
const {
  handleWaitingRoomJoin,
  handleWaitingRoomLeave,
  handleTempRoomLeave
} = require("../utils/voiceVerificationManager");

module.exports = {
  name: Events.VoiceStateUpdate,
  once: false,
  async execute(oldState, newState) {
    const member = newState.member || oldState.member;
    if (!member || member.user?.bot) return;

    const oldChannel = oldState.channel;
    const newChannel = newState.channel;

    // ─────────────────────────────────────────────
    // 1. Voice Activity & Stats Tracking (Permanent)
    // ─────────────────────────────────────────────
    if (!oldChannel && newChannel) {
      handleVoiceJoin(member, newChannel);
    } else if (oldChannel && !newChannel) {
      handleVoiceLeave(member, oldChannel);
    } else if (oldChannel && newChannel && oldChannel.id !== newChannel.id) {
      handleVoiceSwitch(member, oldChannel, newChannel);
    }

    // ─────────────────────────────────────────────
    // 2. Emperor Voice Verification System Hooks
    // ─────────────────────────────────────────────
    const waitingRoomId = VERIFICATION_CONFIG.WAITING_ROOM_ID;
    const isTempPrefix = (ch) => ch && ch.name && ch.name.startsWith(VERIFICATION_CONFIG.TEMP_CHANNEL_PREFIX);

    // Case A: User joined Waiting Room (either fresh connect or switch)
    if (newChannel && newChannel.id === waitingRoomId && oldChannel?.id !== waitingRoomId) {
      handleWaitingRoomJoin(member);
    }

    // Case B: User left Waiting Room (disconnect or switch)
    if (oldChannel && oldChannel.id === waitingRoomId && newChannel?.id !== waitingRoomId) {
      handleWaitingRoomLeave(member);
    }

    // Case C: User disconnected or moved away from temporary verification room
    if (oldChannel && isTempPrefix(oldChannel) && oldChannel.id !== newChannel?.id) {
      handleTempRoomLeave(member, oldChannel.id);
    }
  }
};
