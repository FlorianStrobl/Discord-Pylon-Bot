pylon.tasks.cron('stats', '0 0/5 * * * * *', async () => {
  const channel = await discord.getGuildTextChannel('CHANNEL ID');
  const msg = await channel?.getMessage('MSG ID');
  const serverIp = 'MC SERVER IP';

  const e = new discord.Embed({
    title: 'Server status:',
    color: 0x000000,
    timestamp: new Date().toISOString()
  });

  const req = await fetch('https://api.minetools.eu/ping/' + serverIp);
  const ans = (await req.json()) ?? '404';

  if (ans['description'] == undefined) {
    e.setDescription('Server **offline**');
    await msg?.edit(e);
    return;
  }

  // player names
  let player: Array<string> = [];
  let p: string = '';
  let i: number = 0;
  while (ans['players']['sample'][i] != undefined) {
    player.push(ans['players']['sample'][i]['name']);
    ++i;
  }

  for await (let pl of player) p += ',\n' + pl.toString();

  e.setDescription(
    `Server **online**\nNumber of players online: ${ans['players']['online']}${p}`
  );

  await msg?.edit(e);
});
