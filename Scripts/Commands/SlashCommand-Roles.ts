// Florian Crafter - March 2021 - v 1.1

// Give user roles they want with custom name and with the role Ids
// edit all lines with the comment EDIT to make the code work
const roleCmdConfig = {
  commandName: 'role',
  commandDescription: 'Give/Remove yourself a role.',
  ephemeral: true,
  channels: ['channel id 1', 'channel id 2'], // EDIT let it completly EMPTY to let it work in every channel
  roles: [
    // EDIT Role name and its ID
    ['role 1', 'id'],
    ['role 2', 'id'],
    ['role 3', 'id']
  ]
};

discord.interactions.commands.register(
  {
    name: roleCmdConfig.commandName,
    description: roleCmdConfig.commandDescription,
    ackBehavior: discord.interactions.commands.AckBehavior.AUTO_EPHEMERAL,
    options: (args) => ({
      role: args.string({
        name: 'role',
        description: 'The role you want.',
        required: true,
        choices: roleCmdConfig.roles.map((e) => e[0])
      })
    })
  },
  async (msg, { role }) => {
    if (
      !roleCmdConfig.channels.includes(msg.channelId) &&
      roleCmdConfig.channels.length !== 0
    ) {
      if (roleCmdConfig.ephemeral)
        await msg.respondEphemeral(
          `You can't use this command in this channel!`
        );
      else await msg.respond(`You can't use this command in this channel!`);
      return;
    }

    const _role = roleCmdConfig.roles.find((t) => t[0] == role);
    if (_role !== undefined && msg.member.roles.includes(_role[1])) {
      try {
        await msg.member.removeRole(_role[1]);
        if (roleCmdConfig.ephemeral)
          await msg.respondEphemeral(
            `You already had the <@&${_role[1]}> role, so I removed it.`
          );
        else
          msg.respond(
            `You already had the <@&${_role[1]}> role, so I removed it.`
          );
      } catch (_) {
        if (roleCmdConfig.ephemeral)
          await msg.respondEphemeral(`Error with the ${role} role.`);
        else await msg.respond(`Error with the ${role} role.`);
      }
    } else if (_role !== undefined) {
      try {
        await msg.member.addRole(_role[1]);
        if (roleCmdConfig.ephemeral)
          await msg.respondEphemeral(`You have now the <@&${_role[1]}> role!`);
        else await msg.respond(`You have now the <@&${_role[1]}> role!`);
      } catch (_) {
        if (roleCmdConfig.ephemeral)
          await msg.respondEphemeral(`Error with the ${role} role.`);
        else await msg.respond(`Error with the ${role} role.`);
      }
    } else if (roleCmdConfig.ephemeral)
      await msg.respondEphemeral(`Error with the ${role} role.`);
    else await msg.respond(`Error with the ${role} role.`);
  }
);
