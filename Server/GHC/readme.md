# Pylon-GHC
Still in Beta!
This is the code for the Pylon Discord Bot on the GermanHumorCult Server.
It was entirely written in TypeScript by ClashCrafter#7370.

three apis in use

What the Bot does:
- #news
- #welcome
- #feedback
- #apply
- #surveys
- msgs like the rules
- cmds

TO DO:
- pic.ts
- Minesweeper.ts
- Snake.ts 

KV Keys:
- serverStatus : is server online (little data, boolean) - depriciated (in a SERVERINFO key)
- userCountSize : number of keys with user data (little data, number) - depreciated
- pwd : the password (little data, string) - depriciated (in a SERVERINFO key)
- surveyIds : msg ids from #news messages (little data, string[])
- helps : help msg infos (middle data, object[])
- WarnCases : infos about warned user (middle data, object[]) - depriciated (in new db)
- user.${i} : data about every user (large data, object[])

- applier.${reaction.userId} : TEMP (little data, boolean)
