

const CONSTANTS = {
    VERSION: '0.0.2',

    levels: ['level_hoopoe', 'level_7', 'level_1', 'level_5', 'level_corgi'],

    level_info: {
        'level_hoopoe': {
            music: {name: 'hoopoe_theme.mp3', volume: 0.5},   
            timeStarCutoffs: [90, 120, 180], 
        },
        'level_7': {
            music: {name: 'turtle_theme.mp3', volume: 0.3},   
            timeStarCutoffs: [90, 120, 180], 
        },
        'level_1': {
            music: {name: 'unicyclist_theme_00.mp3', volume: 0.3},   
            timeStarCutoffs: [90, 120, 180], 
        },
        'level_5': {
            music: {name: 'hoopoe_theme.mp3', volume: 0.5},  
            timeStarCutoffs: [50, 75, 120], 
        },
        'level_corgi': {
            music: {name: 'turtle_theme.mp3', volume: 0.5},   
            timeStarCutoffs: [50, 75, 120], 
        },
        'level_run_1': {
            music: {name: 'unicyclist_theme_00.mp3', volume: 0.3},  
            timeStarCutoffs: [30, 60, 90], 
        },
        'level_run_2': {
            music: {name: 'Vampire\'s Shadow.mp3', volume: 0.5},   
            timeStarCutoffs: [90, 120, 180], 
        },

    },
    
    // levels: ['level_corgi', 'level_1', 'level_5', 'level_corgi'],
    AI_ACTIVE: true,
    unlockedLevels: [],
    completedLevels: [],
    RIDDLES_ENABLED: false,
    DEBUG: false,


    // levels: ['level_1', 'level_5', 'level_7']
};
