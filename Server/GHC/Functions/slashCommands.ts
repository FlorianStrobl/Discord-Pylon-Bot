import * as Settings from '../Main/settings';

export async function RoleSlashCommand(
  msg: discord.interactions.commands.SlashCommandInteraction,
  role: string
) {
  if (
    !Settings.roleCommand.channels.includes(msg.channelId) &&
    Settings.roleCommand.channels.length !== 0
  ) {
    if (Settings.roleCommand.ephemeral)
      await msg.respondEphemeral(`You can't use this command in this channel!`);
    else await msg.respond(`You can't use this command in this channel!`);
    return;
  }

  const _role = (Settings.roleCommand.roles as string[][]).find(
    (t) => t[0] == role
  );
  if (_role !== undefined && msg.member.roles.includes(_role[1])) {
    try {
      await msg.member.removeRole(_role[1]);
      if (Settings.roleCommand.ephemeral)
        await msg.respondEphemeral(
          `You already had the <@&${_role[1]}> role, so I removed it.`
        );
      else
        msg.respond(
          `You already had the <@&${_role[1]}> role, so I removed it.`
        );
    } catch (_) {
      if (Settings.roleCommand.ephemeral)
        await msg.respondEphemeral(`Error with the ${role} role.`);
      else await msg.respond(`Error with the ${role} role.`);
    }
  } else if (_role !== undefined) {
    try {
      await msg.member.addRole(_role[1]);
      if (Settings.roleCommand.ephemeral)
        await msg.respondEphemeral(`You have now the <@&${_role[1]}> role!`);
      else await msg.respond(`You have now the <@&${_role[1]}> role!`);
    } catch (_) {
      if (Settings.roleCommand.ephemeral)
        await msg.respondEphemeral(`Error with the ${role} role.`);
      else await msg.respond(`Error with the ${role} role.`);
    }
  } else if (Settings.roleCommand.ephemeral)
    await msg.respondEphemeral(`Error with the ${role} role.`);
  else await msg.respond(`Error with the ${role} role.`);
}
