const MAP_BLOCK_TYPES = {
    empty: ' ',
    block: '#',
    red: 'R',
    gravityUp: 'U',
    gravityDown: 'D',
    spawn: 'S',
    checkpoint: 'C',
    bounce: 'B',
    flashingOn: 'F',
    flashingOff: 'f',
    redFlashOn: '!',
    redFlashOff: '*',
    speedUp: '+',
    highJump: '^',
    gravityChangeMode: 'G',
    statusClear: 'X',
    projectileLauncher: 'P',
};

const TIME_PER_FLASH_MS = 600;

let map = [
    '#########################',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                    C  #',
    '#RRRRRRRRRRRRRRRRRRR### #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                      B#',
    '#                   P   #',
    '#           P           #',
    '#                       #',
    '#              B   B    #',
    '#         B             #',
    '#P    #   P             #',
    '#                   P   #',
    '#          RRRR         #',
    '# B                     #',
    '#     #                 #',
    '#         F             #',
    '#           R # R       #',
    '#    RRRRRRR     RRRRRRR#',
    '#   R      X  #         #',
    '#  R       XC           #',
    '# R R   RRR##RRRRRRRRRRR#',
    '#R     R   RR   ! R     #',
    '#     R         !       #',
    '#    R R R      !  R  R #',
    '#   R           !       #',
    '#  R       R   RR      R#',
    '# R  R        R R  R    #',
    '# R       R  R  R       #',
    '# R    R    R   R       #',
    '# R        R    R    R  #',
    '#        GR     R       #',
    '#     R  R      R R     #',
    '#R      R   RRRRR       #',
    '#RRRRRRR  RR            #',
    '#       RR              #',
    '#     RR       RRRRRRRRR#',
    '#RRRRR       RR         #',
    '#          RR           #',
    '#  C G   RR             #',
    '# #####RR               #',
    '# RRRRRRRRRRRRRRRRRRRRRR#',
    '#                       #',
    '#B                      #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#B             *   *   *#',
    '#              F   F   F#',
    '#           +          *#',
    '#           RRRRR  *   F#',
    '#B        FR  X    F    #',
    '#         R   XC        #',
    '#        R    X##       #',
    '#       R     RRRRRR    #',
    '#      R     R      R   #',
    '#     R     R        R  #',
    '#    R     R    R    R  #',
    '#    R    R    R     R  #',
    '#     R       R     R   #',
    '#      R     R     R    #',
    '#       R   R    RR     #',
    '#        R R    R       #',
    '#         R    R        #',
    '#        R    R         #',
    '#        R   R          #',
    '#RRRRRRRRR+++RRRRRRRRRRR#',
    '#                   #####',
    '#                  CD   #',
    '#               G ###   #',
    '#RRRRRRRRRRRRRRRRRRRRUUU#',
    '#                       #',
    '#                       #',
    '#R RRRRRRRRRRRRRRRRRRRRR#',
    '#R                   D  #',
    '#R                  GC  #', //
    '#RRRRRRRRRRRRRRRRRRR### #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                      B#',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#              R R      #',
    '#              R R      #',
    '#              RDR      #',
    '#              R R      #',
    '#              R R      #',
    '#     R        R R      #',
    '#    R           R      #',
    '#     D           R     #',
    '#        R        R     #',
    '#             R         #',
    '#      R                #',
    '#            RRRURR     #',
    '#                       #',
    '#           U           #',
    '#                   +C  #', // 
    '#RRRRRRRRRRRRRRRR RR### #',
    '#               R R     #',
    '#                #      #',
    '#                       #',
    '#                      B#',
    '#                R R    #',
    '#                RFR R  #',
    '#                R R R R#',
    '#                RFR  B #',
    '#                  R    #',
    '#                 F     #',
    '#         !      R      #',
    '#       +       F       #',
    '#       f               #',
    '#                       #',
    '#       f               #',
    '#      R    *    *      #',
    '#       F          !RRRR#',
    '#           F    F !    #',
    '#    RRRRRRRRRRRRRR!  C #',          
    '#RRRR##################D#',
    '#  R                    #',
    '#  R   U                #',       
    '#  R RRRRRRRRRRRRRRRRRRU#',
    '#  R R                 R#',
    '#  R R                  #',         
    '#  R R                  #',
    '#  R R                  #',
    '#  RDR                  #',
    '#  R R                  #',
    '#  R R                  #',
    '#  R R                  #',
    '#  R R                  #',
    '#  R R R                #',
    '#      R                #',
    '#                       #',
    '#                       #',
    '#      U                #',
    '#RRRRRR R               #',
    '#     R R        D      #',
    '#     R#                #',
    '#     R                 #',
    '#    R  D               #',
    '#   R                   #',
    '#  R                    #',
    '# R                  U  #',
    '#R U                R RR#',
    '#  +                R   #',
    '#  CD               R   #', //         
    '# ###RRRRRRRRRRRRRRRR  +#',
    '#                   RRR##',
    '#                       #',
    '#                       #',
    '#B                      #',
    '#                       #',
    '#   R R R R R R         #',
    '#   R R R R R R         #',
    '#B  BBR R R R R         #',
    '#     BBBBBBBBBBB       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#     BBBBBBBBBBB       #',
    '#                       #',
    '#B RRRRRRR              #',
    '#              !        #',
    '# fFfFfFfF    #       RR#',
    '#              #    RR###',
    '#                   C D #', //       
    '#RRRRRRRRRRRRRRRRRR#### #',
    '####RRRRRRRRRRRRRRRRRRR #',
    '#C +                  R #', //   
    '#UR    F              R #',
    '# R            F      R #',
    '# R                   RU#',
    '# R                  BR #',
    '# R      B            R #',
    '# R                   R #',
    '# R                   R #',
    '# R                   R #',
    '# RB                  R #',
    '# R                   RD#',
    '#DR       B           R #',
    '# R                   R #',
    '# R                   R #',
    '# R       #           R #',
    '# R       +           R #',
    '# R              F    R #',
    '# R                   R #',
    '# R        F          R #',
    '# R                   R #',
    '# R              ###### #',
    '# R                     #',
    '#URRRRRRRRRRRRRRRRRRRRRR#',
    '#                       #',
    '##                      #',
    '#                       #',
    '###                     #',
    '#                       #',
    '#R#                     #',
    '#                       #',
    '#                       #',
    '#R#                     #',
    '#                       #',
    '#                       #',
    '# #                     #',
    '#  R                    #',
    '#  R                    #',
    '# #                     #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#B                      #',
    '#            B          #',
    '#                       #',
    '#                      ^#',
    '#B                     ##',
    '#                       #',
    '#                       #',
    '#RR                     #',
    '#  R   +           B    #',
    '#      B                #',
    '# C                     #', //   
    '# ##RRRRRRRRRRRRRRRRRRR #',
    '#                       #',
    '#                       #',
    '#F                      #',
    '#                       #',
    '#                       #',
    '# fFfFfFfFfF            #',
    '#             #         #',
    '#                       #',
    '#                  #    #',
    '#                       #',
    '#                       #',          
    '#      R              ###',
    '#   + R R               #',
    '#  C^ R R      ^        #', //          
    '# ####R R      #        #',
    '# RRRRR RRRRRRRRRRRRRRRR#',
    '# R            DR       #',
    '# R            DR       #',
    '# R     D      DR       #',
    '# R         R  DR       #',
    '# R         R  DR       #',
    '# R      U  R  DR       #',
    '# RRR RR    R  DR       #',
    '# R     R   R  DR       #',
    '# R  C  R  RR  DR       #', //   
    '# R #####R RR   R       #',
    '# R RRR   R R   #########',
    '# R   R     R    C      #', //   
    '# R   R     RRRRRRRR  RU#',
    '#DR   R              RR#',
    '# R   R                 #',
    '# R                     #',
    '# R                 B   #',
    '# R                 R   #',
    '#     R                 #',
    '#     R                 #',
    '#     R             B   #',
    '#     R                 #',
    '#     R                 #',
    '#    R        R     #   #',
    '# U R                   #',
    '#R R    R     #         #',
    '#                       #',
    '#       #               #',
    '#                       #',
    '#R  C^                  #', //   
    '## ###RRRRRRRRRRRRRRRRRR#',
    '#                       #',
    '# #                     #',
    '#                       #',
    '#  #  R                 #',
    '#    #                  #',
    '#     #                 #',
    '#           #           #',
    '#                       #',
    '#                       #',
    '#                   B   #',
    '#             #         #',
    '# +     #               #',
    '# #RRRRRRRRRRRRRRRRRRRRR#',
    '#                       #',
    '# #                     #',
    '# C                     #', //   
    '#####                   #',
    '#                       #',
    '#                       #',
    '#       B       B       #',
    '#                       #',
    '#                      B#',
    '#                       #',
    '#                       #',
    '#                       #',
    '#               B       #',
    '#+       #              #',
    '##           RRRRRRRRRRR#',
    '#                       #',
    '##                      #',
    '#    #           + ###RR#',
    '#            ##### CD ###', //   
    '#RRRRRRRRRRRR########U  #',
    '#############RRRRRRRRR  #',
    '#           RR   X      #',
    '#           R    X      #',
    '#           RR  R######B#',
    '#           R  RR       #',
    '#           R   R       #',
    '#           R   R       #',
    '#           R R R       #',
    '#           R   R       #',
    '#           RR  R       #',
    '#           R   R       #',
    '#           R   R       #',
    '#           R   R       #',
    '#           R  RR       #',
    '#           R   RRRRRRRR#',
    '#           R     DX   R#',
    '#           R  GC DX   R#', //
    '#           ########   R#',
    '####RRRRRRRRRRRRRRRRR  R#',
    '#       R           R  R#',
    '#       R           R  R#',
    '#       R           R  R#',
    '#   R   R    RRRRRR R  R#',
    '#   R     D  R    R    R#',
    '#   R     CG R    R     #', // 
    '#   R    ####R    R     #',
    '#   RRRRRRRRRR  R R     #',
    '#               R RRRR  #',
    '#               R  ###RR#',
    '#               RG CD ###', //   
    '#RRRRRRRRRRRRR##R####U  #',
    '#############RRRRRRRRR  #',
    '#   CU               R  R', //   
    '## #####R#R#   F     R  R',
    '#      R   R      F  R  R',
    '# #    R   R         RDDR',
    '#      R R R    F    R  R',
    '# #    R RDR F       R  R',
    '#      R R R         R  R',
    '# #    R R R F    F  R  R',
    '#        R R            #',
    '#########R R            #',
    '#    RDRD  R            #',
    '#          RRRRRRRRRRRRR#',
    '#          R            #',
    '#C         R            #', //   
    '## RRURURURR#############',
    '#   R R R R             #',
    '##  R R R R             #',
    '#                       #',
    '##                      #',
    '#                       #',
    '##                      #',
    '#                       #',
    '#  # R R                #',
    '#     #  R R            #',
    '#      #  #      ########',
    '#          #     #      #',
    '#                C      #', //   
    '#RRRRRRRRRRRRRR#####    #',
    '#                       #',
    '#          R          R #',
    '#                       #',
    '#    R        R         #',
    '#                       #',
    '#      R         R      #',
    '#                       #',
    '#  R                 R  #',
    '#            R          #',
    '#                       #',
    '#    R                 R#',
    '#DDDD    DDDDD    DDDDDD#',
    '#                       #',
    '#                       #',
    '#UUUUUUU    UUUUU   UUUU#',
    '#                       #',
    '#                       #',
    '# C                     #', //   
    '#B#                     #',
    '#                       #',
    '#                       #',
    '# B                     #',
    '#                       #',
    '#       R               #',
    '#    B                  #',
    '#          R            #',
    '#         BC     R   R R#', //   
    '#          #            R',
    '#              # #   # ##',
    '#                       R',
    '#RRR                   ##',
    '####                    #',
    '#  C      #    ##RRR#RRR#', //  
    '# ####           R#######',
    '#D#RRRRRRRRRRRRRRR      #',
    '# #              #    R #',
    '# #  D#     ##        R #',
    '# R    ##             R #',
    '#                     R #',
    '#  U RRR              R #',
    '#   R   R             R #',
    '#R       R            R #',
    '#R        R           R #',
    '#R  #     R           R #',
    'R  RRRRR  R           R #',
    '##      R RRRRRRRRRRRRR #',
    '#    C  R            C U#', // //
    '####### #################',
    '#######            RRR###',
    '########           C    #', //  
    '##########RR#RR#######  #',
    '#     RRRRRRRRRRRRRRR#DD#',
    '# #   #              #  #',
    '# #    R             #  #',
    '# #   #              #  #',
    '# #       ##         #  #',
    '# #            F     #  #',
    '# #                  #  #',
    '#U#######          ###  #',
    '#   C   #             UU#', //  
    '####### ##############RR#',
    '      #           #      ',
    '      #           #      ',
    '      #           #      ',
    '      #B          #      ',
    '      #           #      ',
    '      #  #        #      ',
    '      #      F    #      ',
    '      #          ##      ',
    '      #           #      ',
    '      #          ##      ',
    '      #      F    #      ',
    '      #  C        #      ', //  
    '      # ###RRRRRRR#      ',
    '      #           #      ',
    '      #           #      ',
    '      #           #      ',
    '      #B          #      ',
    '      #           #      ',
    '      #           #      ',
    '      #           #      ',
    '      #B          #      ',
    '      #           #      ',
    '      #           #      ',
    '      #     B     #      ',
    '      #           #      ',
    '      #          B#      ',
    '      #           #      ',
    '      #         ###      ',
    '      #    ##     #      ',
    '      ##          #      ',
    '      #           #      ',
    '      ##          #      ',
    '      #           #      ',
    '      #           #      ',
    '      #     B     #      ',
    '      #         C #      ', //  
    '      #RRRRRRR ####      ',
    '      #           #      ',
    '      #       #   #      ',
    '      #           #      ',
    '      #       #   #      ',
    '      #           #      ',
    '      #       #   #      ',
    '      #           #      ',
    '      #       #   #      ',
    '      # C         #      ', //  
    '      ### #RRRRRRR#      ',
    '      #           #      ',
    '      #  #        #      ',
    '      #           #      ',
    '      # ##        #      ',
    '      #     ##    #      ',
    '      #          ##      ',
    '      #           #      ',
    '      #    #  #####      ',
    '      ##          #      ',
    '      #           #      ',
    '      # #         #      ',
    '      #     S     #      ', //  
    '      #############      '
];


















































































let oldmap = [
    '#########################',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                                                                ',
    '#                      C    F   F    F    F                      ', // 24 A/B
    '##################### ###                     F                  ',
    '#                       #                         F          ####',
    '#                       #                              F   +C D #', // 23B
    '#                       #RRRRRRRRRRRRRRRRRRR               #### #',
    '#                       #               ####RRRRRRRRRRRRRRRRRRR #',
    '#                       #               #C +                  R #', // 22B
    '#                       #               #UR    F              R #',
    '#                       #               # R            F      R #',
    '#                       #               # R                   RU#',
    '#                       #               # R                  BR #',
    '#                       #               # R      B            R #',
    '#                       #               # R                   R #',
    '#                       #               # R                   R #',
    '#                       #               # R                   R #',
    '#                       #               # RB                  R #',
    '#                       #               # R                   RD#',
    '#                       #               #DR       B           R #',
    '#                       #               # R                   R #',
    '#                       #               # R                   R #',
    '#                       #               # R       #           R #',
    '#                       #               # R       +           R #',
    '#                       #               # R              F    R #',
    '#                       #               # R                   R #',
    '#                       #               # R        F          R #',
    '#                       #               # R                   R #',
    '#                       #               # R              ###### #',
    '#                       #               # R                     #',
    '#                       #               #URRRRRRRRRRRRRRRRRRRRRR#',
    '#  C   +                #               #                       #', // 22A
    '# #######################               ##                      #',
    '#                       #               #                       #',
    '#                       #               ###                     #',
    '#                       #               #                       #',
    '#B                      #               #R#                     #',
    '#                       #               #                       #',
    '#   R R R R R R         #               #                       #',
    '#   R R R R R R R       #               #R#                     #',
    '#B  BBR R R R R R       #               #                       #',
    '#     BBBBBBBBBBB       #               #                       #',
    '#                       #               # #                     #',
    '#     #BBBBBBBBBB       #               #  R                    #',
    '##                      #               #  R                    #',
    '#                       #               # #                     #',
    '#                       #               #                       #',
    '#B                      #               #                       #',
    '#              R        #               #                       #',
    '# fFfFfFfF    #         #               #B                      #',
    '#              #        #               #            B          #',
    '#                   C   #               #                       #', // 21A
    '#RRRRRRRRRRRRRRRRRR#### #               #                      ^#',
    '#                       #               #B                     ##',
    '#                      ##               #                       #',
    '#                       #               #                       #',
    '#                      ##               #                       #',
    '#                       #               #      +           B    #',
    '#                      ##################RR    B                #',
    '#                                         C                     #', // 21B
    '#      R              ######################RRRRRRRRRRRRRRRRRRRR#',
    '#   + R R               #',
    '#  C^ R R               #', // 20
    '# ####R R      #        #',
    '# RRRRR RRRRRRRRRRRRRRRR#',
    '# R            DR       #',
    '# R            DR       #',
    '# R     D      DR       #',
    '# R         R  DR       #',
    '# R         R  DR       #',
    '# R      U  R  DR       #',
    '# RRR RR    R  DR       #',
    '# R     R   R  DR       #',
    '# R  C  R  RR  DR       #', // 19
    '# R #####R RR   R       #',
    '# R RRR   R R   #########',
    '# R   R     R    C      #', // 18
    '# R   R     RRRRRRRR  RU#',
    '#DR   R              RR#',
    '# R   R                 #',
    '# R                     #',
    '# R                 B   #',
    '# R                 R   #',
    '#     R                 #',
    '#     R                 #',
    '#     R             B   #',
    '#     R                 #',
    '#     R                 #',
    '#    R        R     #   #',
    '# U R                   #',
    '#R R    R     #         #',
    '#                       #',
    '#       #               #',
    '#                       #',
    '#R  C^                  #', // 17
    '## ###RRRRRRRRRRRRRRRRRR#',
    '#                       #',
    '# #                     #',
    '#                       #',
    '#  #  R                 #',
    '#    #                  #',
    '#     #                 #',
    '#           #           #',
    '#                       #',
    '#                       #',
    '#                   B   #',
    '#             #         #',
    '# +     #               #',
    '# #                     #',
    '#                       #',
    '# #                     #',
    '# C                     #', // 16
    '#####                   #',
    '#                       #',
    '#                       #',
    '#       B       B       #',
    '#                       #',
    '#                      B#',
    '#                       #',
    '#                       #',
    '#                       #',
    '#               B       #',
    '#+       #              #',
    '##           RRRRRRRRRRR#',
    '#                       #',
    '##                      #',
    '#    #           + ###RR#',
    '#            ##### CD ###', // 15
    '#RRRRRRRRRRRR########U  #',
    '#############RRRRRRRRR  #',
    '#   CU               R  R', // 14
    '## #####R#R#   F     R  R',
    '#      R   R      F  R  R',
    '# #    R   R         RDDR',
    '#      R R R    F    R  R',
    '# #    R RDR F       R  R',
    '#      R R R         R  R',
    '# #    R R R F    F  R  R',
    '#        R R            #',
    '#########R R            #',
    '#    RDRD  R            #',
    '#          RRRRRRRRRRRRR#',
    '#          R            #',
    '#C         R            #', // 13
    '## RRURURURR#############',
    '#   R R R R             #',
    '##  R R R R             #',
    '#                       #',
    '##                      #',
    '#                       #',
    '##                      #',
    '#                       #',
    '#  # R R                #',
    '#     #  R R            #',
    '#      #  #      ########',
    '#          #     #      #',
    '#                C      #', // 12
    '#RRRRRRRRRRRRRR#####    #',
    '#                       #',
    '#          R          R #',
    '#                       #',
    '#    R        R         #',
    '#                       #',
    '#      R         R      #',
    '#                       #',
    '#  R                 R  #',
    '#            R          #',
    '#                       #',
    '#    R                 R#',
    '#DDDD    DDDDD    DDDDDD#',
    '#                       #',
    '#                       #',
    '#UUUUUUU    UUUUU   UUUU#',
    '#                       #',
    '#                       #',
    '# C                     #', // 11
    '#B#                     #',
    '#                       #',
    '#                       #',
    '# B                     #',
    '#                       #',
    '#       R               #',
    '#    B                  #',
    '#          R            #',
    '#         BC     R   R R#', // 10
    '#          #            R',
    '#              # #   # ##',
    '#                       R',
    '#RRR                   ##',
    '####                    #',
    '#  C      #    ##RRR#RRR#', // 9
    '# ####           R#######',
    '#D#RRRRRRRRRRRRRRR      #',
    '# #              #    R #',
    '# #  D#     ##        R #',
    '# R    ##             R #',
    '#                     R #',
    '#  U RRR              R #',
    '#   R   R             R #',
    '#R       R            R #',
    '#R        R           R #',
    '#R  #     R           R #',
    'R  RRRRR  R           R #',
    '##      R RRRRRRRRRRRRR #',
    '#    C  R            C U#', // 7, 8
    '####### #################',
    '#######            RRR###',
    '########           C    #', // 6
    '##########RR#RR#######  #',
    '#     RRRRRRRRRRRRRRR#DD#',
    '# #   #              #  #',
    '# #    R             #  #',
    '# #   #              #  #',
    '# #       ##         #  #',
    '# #            F     #  #',
    '# #                  #  #',
    '#U#######          ###  #',
    '#   C   #             UU#', // 5
    '####### ##############RR#',
    '      #           #      ',
    '      #           #      ',
    '      #           #      ',
    '      #B          #      ',
    '      #           #      ',
    '      #  #        #      ',
    '      #      F    #      ',
    '      #          ##      ',
    '      #           #      ',
    '      #          ##      ',
    '      #      F    #      ',
    '      #  C        #      ', // 4
    '      # ###RRRRRRR#      ',
    '      #           #      ',
    '      #           #      ',
    '      #           #      ',
    '      #B          #      ',
    '      #           #      ',
    '      #           #      ',
    '      #           #      ',
    '      #B          #      ',
    '      #           #      ',
    '      #           #      ',
    '      #     B     #      ',
    '      #           #      ',
    '      #          B#      ',
    '      #           #      ',
    '      #         ###      ',
    '      #    ##     #      ',
    '      ##          #      ',
    '      #           #      ',
    '      ##          #      ',
    '      #           #      ',
    '      #           #      ',
    '      #     B     #      ',
    '      #         C #      ', // 3
    '      #RRRRRRR ####      ',
    '      #           #      ',
    '      #       #   #      ',
    '      #           #      ',
    '      #       #   #      ',
    '      #           #      ',
    '      #       #   #      ',
    '      #           #      ',
    '      #       #   #      ',
    '      # C         #      ', // 2
    '      ### #RRRRRRR#      ',
    '      #           #      ',
    '      #  #        #      ',
    '      #           #      ',
    '      # ##        #      ',
    '      #     ##    #      ',
    '      #          ##      ',
    '      #           #      ',
    '      #    #  #####      ',
    '      ##          #      ',
    '      #           #      ',
    '      # #         #      ',
    '      #     S     #      ', // 1
    '      #############      '
];





