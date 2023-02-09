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
    winText: 'W',
};

const TIME_PER_FLASH_MS = 600;

let map = [
    "   RRRRRRRRRRRRRRRR RRR                                      ",
    "   R               R   R RR                                  ",
    "   R               R    R  R RRR RRRR                        ",
    "   R               R    R   R   R    R                       ",
    "   R               R    R   R   R C  R                       ",
    "   R               R   DR  DR  DR #  RRRRRRRRRRRRRRRRRRRRRRRR",
    "   R               R  R R R R R R R   R          R     R    R",
    "   R               R  R RUR RUR  UR D R          R     R    R",
    "RRRR             B    R   R   R   RRURR          R     R    R",
    "                   D  R   R   R   R   R  D R D R            R",
    "                   C  R   R  R RRRR   R                     R",
    "      DRRRR RRRRRU #RRR  R RR     R  RR  R U R U R     R    RRRRRRRRRRRRR",
    " C RUR     B       R   RR         RDR            R     R                R",
    " # R       U       R              R              R     R                R",
    "RRRR               R              R   C          R  D  R  BC            R",
    "   R               R              R  R#RRRRRRRRRRRRRURRRRRR#RRR#        R",
    "   R               R              RRUR                        R         R",
    "   R               R                                          R#        R",
    "   RRRRRRRRRRRRRRRRR                                          R         R     ",
    "                                                              R#        R                    ",
    "                                                              R    #    R                    ",
    "                                                              R        #R                    ",
    "                                                              R         R                    ",
    "                                                              R         R                    ",
    "                                                  RRRRRRRRRRRRRRR       R                    ",
    "                                                  R                 B   R                    ",
    "                                                 RR                     R                    ",
    "                                                 RR                     R                    ",
    "                                                 R  #  f                R                    ",
    "                                                 R  RRRR   #  F   B     R                    ",
    "                                                 R     R   R            R                    ",
    "                                                 R C   RRRRRRRRRRRRRRRRRR                    ",
    "                                              RRRRB### R                                     ",
    "                                              R      # R                                     ",
    "                                              R      # R                                     ",
    "                                              R      #DR                                     ",
    "                                              R      # R                                     ",
    "                                              R      # R                                     ",
    "                                              R      # R                                     ",
    "                                              R      # R                                     ",
    "                                              R       UR                                     ",
    "                               RRRRRRR        R     ####                                     ",
    "                               R     R        R       R                                      ",
    "                          RRRRRR     RRRRRRRRRR  #    R                                      ",
    "                         RR        R                  R                                      ",
    "          RRRRRRRRRRRRRRRR    ##RRRR               #  R                                      ",
    "        RRR                   R R                     R                                      ",
    "   RRRRRR                     R R                 #   R                                      ",
    "  RR   R        R#+           R R                     R                                      ",
    " RR      C      R #        B  R R               R  #  R                                      ",
    "RR       #**f  #R RRR      R  R R          RRRR#R C   R                                      ",
    "R        R  F!  R   RRRRRRRRRRR RR         R    RR#RRRR                                      ",
    "R        R      R                RR +      R                                                 ",
    "R      B RRRRRRRR                 RR#B     R                                                 ",
    "R        R                          #RRRRRRR                                                 ",
    "R        R                                                                                   ",
    "R   B    RR                                                                                  ",
    "R         R                                                                                  ",
    "R      B  RR                                                                                 ",
    "R          RR                                                                                ",
    "R           RR                                                                               ",
    "R            R                                                                               ",
    "R      B  f  R                                                                               ",
    "R           #R                                                                               ",
    "R         C RR                                                                               ",
    "RRRRRRRRRR#               R",
    "R         R               R",
    "R         R ##RR#         R",
    "R         RRRR  R #       R",
    "R   #RR   R   D  RRRRR#   R",
    "R RR    # R  #   R   #   #R",
    "R         R    R R R      R",
    "RU      #RRRR RR R   # #  R",
    "R R #     R#   R R #R     R",
    "R         R    R    R     R",
    "R #       R RR#R##RRRRRRRRR",
    "R   R    RR   UR          R",
    "R    #    R    R          R",
    "R        ##### R          R",
    "R            C R          R",
    "R     C  #RRRRRR          R",
    "R     #   R               R",
    "RRRRXRRRRRRRRRRRRRRRRRRRRRR",
    "R                       R",
    "R                       R",
    "R   #          #        R",
    "R                       R",
    "R                       R",
    "R           #      ^    R",
    "R       #          ##   R",
    "RRRRRRRRRRRRRRRRRRRR  RRR",
    "R #                 # R  ",
    "R                     R  ",
    "R # C               # R  ",
    "R  R#  +              R  ",
    "R #    ##        #  RRR  ",
    "R                   R    ",
    "R #      RRRRRRRRRRRR    ",
    "RRR  # R            R    ",
    "R  R                R    ",
    "R   R  # #          R    ",
    "R    R         # #  R    ",
    "R     RRRR  #       R    ",
    "R                  #R    ",
    "R                   R    ",
    "R           #     # R    ",
    "R       #          RR    ",
    "R   C             # R    ",
    "R  ####RRRRRRRRRRRRRR    ",
    "R#          R",
    "R           R",
    "R#    #   # R",
    "R   #   #   R",
    "R     R R # R",
    "R           R",
    "R   # # # # R",
    "RC          R",
    "R# RRRRRRRRRR",
    "R           R",
    "R#          R",
    "R    #     R",
    "R  #     # R",
    "R         RR",
    "R        # R",
    "R    R    RR",
    "R        # R",
    "RS   #     R",
    "R#RRRRRRRRRR",
    
];
















































































