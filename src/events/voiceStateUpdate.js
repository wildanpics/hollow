const { Events } = require("discord.js");
const {
  handleVoiceJoin,
  handleVoiceLeave,
  handleVoiceSwitch
} = require("../storage/voiceStorage");

module.exports = {
  name: Events.VoiceStateUpdate,
  once: false,
  async execute(oldState, newState) {
    const member = newState.member || oldState.member;
    if (!member || member.user?.bot) return;

    const oldChannel = oldState.channel;
    const newChannel = newState.channel;

    // 1. User Joined Voice Channel
    if (!oldChannel && newChannel) {
      handleVoiceJoin(member, newChannel);
      return;
    }

    // 2. User Left Voice Channel
    if (oldChannel && !newChannel) {
      handleVoiceLeave(member, oldChannel);
      return;
    }

    // 3. User Switched Voice Channel
    if (oldChannel && newChannel && oldChannel.id !== newChannel.id) {
      handleVoiceSwitch(member, oldChannel, newChannel);
      return;
    }
  }
};
