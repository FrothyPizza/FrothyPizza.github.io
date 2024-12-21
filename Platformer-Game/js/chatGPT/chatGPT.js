

// API Key in secret.js
const API_URL = 'https://api.openai.com/v1/chat/completions';
const TOLD_RIDDLES = ["shadow", "joke", "piano", "cloud", "tadpole", "silence", "boat", "the wind", "book", "journal", "music"];
const model = "gpt-4o-mini";
const AI_ACTIVE = CONSTANTS.AI_ACTIVE;

/*
            "riddle_text": "In the heart of the sea, a silent giant sleeps. It holds treasures untold, yet none can it keep. What is it?",
            "answer": "An island",
            "possible_other_answers": [
                "A sunken ship"
            ],
            "explanation": "This riddle uses metaphor to describe an island as a 'silent giant' sleeping in the sea, holding treasures (natural resources, beauty) that it cannot keep because they can be explored or taken by others. It's a good riddle because it prompts thinking about natural formations in a poetic way. 'A sunken ship' could also fit as it rests in the sea holding treasures."
        },*/

// Function to generate a riddle based on the boss information
async function generateRiddle(enemyInfo) {

    // return a random riddle from RIDDLES[enemyInfo]
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            let riddles = RIDDLES[enemyInfo];

            let riddle = riddles[Math.floor(Math.random() * riddles.length)];

            resolve({
                riddle_text: riddle.riddle_text,
                answer: riddle.answer,
                possible_other_answers: riddle.possible_other_answers,
                explanation: riddle.explanation
            });
        }, Math.random() * 500 + 500);
    });

    /*
    if(AI_ACTIVE) {

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                  {
                    "role": "system",
                    "content": [
                      {
                        "type": "text",
                        "text": "You are an advanced riddle writer. Your responses should be ONLY a one- to two-sentence riddle. Generate just a single riddle, and don't output anything else. The answer to the riddle should not be obvious. The answer can't be what you are. Output the riddle as follows: {\"riddle_text\": \"...\", \"answer\": \" ... \"} The riddle answers that have been used so far are:" + JSON.stringify(TOLD_RIDDLES) + ". Do not tell a duplicate riddle."
                      }
                    ]
                  },
                  {
                    "role": "user",
                    "content": [
                      {
                        "type": "text",
                        "text": "The person telling the riddle is an old, wise " + enemyInfo + ". Generate the json object for a riddle. The answer should not be " + enemyInfo + ", nor should it be from the list " + JSON.stringify(TOLD_RIDDLES) + "."
                      }
                    ]
                  }
                ],
                temperature: 1.3,
                max_tokens: 250,
                top_p: 1,
                frequency_penalty: 0,
                presence_penalty: 0,
                response_format: {
                  "type": "text"
                },
            })});

        const data = await response.json();
        const riddle = JSON.parse(data.choices[0].message.content);
        return riddle;
    } else {
        // Mock riddle generation with async timeout
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve({
                    riddle_text: "I am a riddle. What is a thing and a thing and a thing?"
                    + (Math.random() > 0.5 ? "This is a test riddle meant to text the text box. Test." : ""),
                    answer: "Riddle"
                });
            }, Math.random() * 500 + 500);
        });
    }*/
}

// Function to classify the user's answer to the riddle
async function classifyRiddle(riddle, correctAnswer, userAnswer, enemyInfo) {

    if(userAnswer == "" || userAnswer == null || userAnswer == " ") {
      userAnswer = "I don't know";
    }

    if(!AI_ACTIVE) {
        // Mock classification with async timeout
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                let classification = Math.floor(Math.random() * 10) + 1;
                // console.log(`Mock riddle classification: ${classification}`);
                resolve({
                    classification: Math.floor(Math.random() * 10) + 1,
                    comment: "this is a comment"
                });
            }, Math.random() * 500 + 500);
        });
    } else {

        // console.log("riddle", riddle);
        // console.log("correctAnswer", correctAnswer);
        // console.log("userAnswer", userAnswer);
        // console.log("\n")

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: model,
                messages: [
                  {
                    "role": "system",
                    "content": [
                      {
                        "type": "text",
                        "text": `You are an advanced riddle classifier. Below, you will see the text of a riddle, the answer to that riddle, and the answer that someone came up with. You must determine whether the person's answer is 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, where 10 would be the correct answer, 9 is mostly correct, etc. There could be multiple correct answers to a riddle. If the answer is vague, it's bad. The comment should be dramatic, and are barely willing to admit that a correct answer was correct (even though it was). You're angry if the answer was wrong and generally sassy. Roleplay as an old, wise ${enemyInfo}, and you only have medivial world knowledge. Use a lot of ${enemyInfo} puns. Mention the correct answer in the comment. Keep the comment brief but concise. You are very generous with your classification, so you give > 5/10 a lot. Your output should be in the format: {\"classification\": \" ... \", \"comment\": \"...\"}. ONLY output the json object. ` 
                    }
                    ]
                  },
                  {
                    "role": "user",
                    "content": [
                      {
                        "type": "text",
                        "text": `Output the json classification for {\"riddle_text\": \"${riddle.riddle_text}\", \"answer\": \"${correctAnswer}\", \"user answer\": \"${userAnswer}\", \"possible_other_answers\": ${JSON.stringify(riddle.possible_other_answers)}, \"explanation\": \"${riddle.explanation}\"}`

                      }
                    ]
                  }
                ],
                temperature: 1.2,
                max_tokens: 200,
                top_p: 1,
                frequency_penalty: 0,
                presence_penalty: 0,
                response_format: {
                  "type": "text"
                },
              })
        });

        const data = await response.json();
        // console.log("response", data.choices[0].message.content);

        const classification = JSON.parse(data.choices[0].message.content);
        // console.log(classification);
        return classification;
    }
}

