
if(typeof window === 'undefined') {
    self.importScripts('../javascript/tetris-gamestate.js');
    self.importScripts('../javascript/constants.js');
    self.importScripts('../javascript/tetris-ai.js');




    self.onmessage = function(e) {
        let args = e.data.args;


        let gameState = args[0];
        let curMino = args[1];
        let nextList = args[2];

        gameState.__proto__ = TetrisGameState.prototype;

        ai_nodes_evaluated = 0;
        self.postMessage(findBestMovesDFS(gameState, curMino, nextList, 0, 1));
        //console.log('ai_nodes_evaluated: ' + ai_nodes_evaluated);
        // self.postMessage(findBestMoves(gameState, curMino, nextList));

        

    }

}