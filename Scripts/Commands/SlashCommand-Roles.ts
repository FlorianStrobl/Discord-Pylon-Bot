// Give user roles they want with custom name and with the role Ids
// edit all lines with the comment EDIT to make the code work

// EDIT Role names (has to be same as in Role)
const choices: string[] = ['role 1', 'role 2', 'role 3'];

// EDIT Role name and its ID
const Role: [string, string][] = [
  ['role 1', 'id'],
  ['role 2', 'id'],
  ['role 3', 'id']
];

// EDIT channels in which the command can be executed
const channels = ['channel id 1', 'channel id 2'];

discord.interactions.commands.register(
  {
    name: 'role',
    description: 'Give/Remove yourself a role.',
    showSourceMessage: true,
    options: (args) => ({
      role: args.string({
        name: 'role',
        description: 'The role you want.',
        required: true,
        choices: choices
      })
    })
  },
  async (msg, { role }) => {
    if (!channels.includes(msg.channelId) && channels.length !== 0) {
      await msg.respond(`You can't use this command in this channel!`);
      await msg.acknowledge(true);
      return;
    }

    const index = Role.findIndex((t) => t[0] == role);

    if (index !== -1 && msg.member.roles.includes(Role[index][1])) {
      try {
        await msg.member.removeRole(Role[index][1]);
        await msg.respond(
          `You already had the <@&${Role[index][1]}> role, so I removed it.`
        );
      } catch (_) {
        await msg.respond(`Error with the ${role} role.`);
      }
    } else if (index !== -1) {
      try {
        await msg.member.addRole(Role[index][1]);
        await msg.respond(`You have now the <@&${Role[index][1]}> role!`);
      } catch (_) {
        await msg.respond(`Error with the ${role} role.`);
      }
    } else await msg.respond(`Error with the ${role} role.`);

    await msg.acknowledge(true);
  }
);
