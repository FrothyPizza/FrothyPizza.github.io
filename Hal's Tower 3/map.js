const MAP_BLOCK_TYPES = {
    empty: ' ',
    block: '#',
    red: 'R',
    gravityUp: 'U',
    gravityDown: 'D',
    spawn: 'S',
    checkpoint: 'C',
    bounce: 'B',
    finish: 'F'

};

const map = [
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
    '#      #                #',
    '# #          R          #',
    '#             #         #',
    '#   #        #D         #',
    '#                      ##',
    '#     #      #    ##    #',
    '#   #    #              #',
    '#   #        #          #',
    '#  ###           #      #',
    '## D  #    R #U         #',
    '#      #         #      #',
    '##           #       #  #',
    '#   U            ###    #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#                       #',
    '#C                      #',
    '## #####R#R##############',
    '#      R   R            #',
    '# #    R   R            #',
    '#      R R R            #',
    '# #    R RDR            #',
    '#      R R R            #',
    '# #    R R R            #',
    '#        R R            #',
    '#########R RRRRRRRRRRRRR#',
    '#    RDRD  R            #',
    '#          R            #',
    '#         CR            #',
    '#C         R            #',
    '## #RURURURR########### #',
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
    '####                    #',
    '#  C                    #',
    '# #######################',
    '#D#RRRRRRRRRRRRRRR      #',
    '# #              #    R #',
    '# #  D#     ##        R #',
    '# R    ##             R #',
    '#                     R #',
    '#  U RRR              R #',
    '#   R   R             R #',
    '#R       R            R #',
    '#         R           R #',
    '##  #     R           R #',
    'R  RRRRR  R           R #',
    '##      R RRRRRRRRRRRRR #',
    '#    C  R            C U#',
    '####### #################',
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
    '      #         C #      ',
    '      #RRRRRRR ####      ',
    '      #           #      ',
    '      #       #   #      ',
    '      #           #      ',
    '      #       #   #      ',
    '      #           #      ',
    '      #       #   #      ',
    '      #           #      ',
    '      #       #   #      ',
    '      # C         #      ',
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
    '      #     S     #      ',
    '      #############      '
];


