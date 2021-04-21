import * as Cron from '../Functions/cron';

pylon.tasks.cron('password', '0 0 0 * * Mon *', Cron.NewPassword); // password one per week
pylon.tasks.cron('stats', '0 0/5 * * * * *', Cron.StatsChannels); // #stats
pylon.tasks.cron('ttl', '0 0/5 * * * * *', Cron.TTLHandler); // #stats
pylon.tasks.cron('news', '0 0 0-23 * * * *', Cron.NewsMessages); // #news auto messages
