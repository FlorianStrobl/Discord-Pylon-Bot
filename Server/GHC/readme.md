# Pylon-GHC
Still in Beta!
This is the code for the Pylon Discord Bot on the GermanHumorCult Server.
It was entirely written in TypeScript by ClashCrafter#7370.

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
- serverStatus : is server online (little data, boolean)
- userCountSize : number of keys with user data (little data, number)
- pwd : the password (little data, string)
- surveyIds : msg ids from #news messages (little data, string[])
- helps : help msg infos (middle data, object[])
- WarnCases : infos about warned user (middle data, object[])
- user.${i} : data about every user (large data, object[])

- applier.${reaction.userId} : TEMP (little data, boolean)
