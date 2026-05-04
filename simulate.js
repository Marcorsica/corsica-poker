{
  "sessionId": "35fca330-5885-46a0-8ee5-d9f6fc4d88f3",
  "startTime": "2026-05-03T14:00:49.028Z",
  "version": "1.0",
  "meta": {
    "app": "Corsica Poker A2",
    "port": 3001
  },
  "hands": [
    {
      "handId": "334642f9-5408-4b2e-b8c2-797d91935811",
      "gameId": "f89819b9-2e39-49fc-9cfe-7c4ce0a2d5fd",
      "playerCount": 7,
      "startTime": "2026-05-03T14:01:05.020Z",
      "createdAt": "2026-05-03T14:01:05.019Z",
      "initialState": {
        "balance": null
      },
      "rng": {
        "algorithm": "sha256 deterministic shuffle",
        "serverSeedHash": "22b639510b9f4c87d06e258a179275e9b8747503bfdb9af7cebcb94b0e6aab9d",
        "clientSeed": "client-f89819b9",
        "nonce": 0,
        "deckCommitment": "5296308915a51a5b51eb910ef606f46aeab63de5529ab256f6b3e8b32cddf95f",
        "dealtHands": [
          [
            "KD",
            "AC"
          ],
          [
            "QH",
            "7H"
          ],
          [
            "7D",
            "5S"
          ],
          [
            "8D",
            "6D"
          ],
          [
            "9H",
            "10C"
          ],
          [
            "9S",
            "QC"
          ],
          [
            "6S",
            "10D"
          ]
        ]
      },
      "actions": [
        {
          "type": "hand_start",
          "playerCount": 7,
          "extremeCaseId": null,
          "timestamp": "2026-05-03T14:01:05.021Z"
        },
        {
          "type": "odds_computed",
          "phase": "pre",
          "totalBoards": 501942,
          "timestamp": "2026-05-03T14:01:06.506Z"
        }
      ],
      "streets": {},
      "result": {}
    },
    {
      "handId": "1cf787a8-3c21-45ff-95f6-210638085e40",
      "gameId": "0d4ee13d-e98b-4a26-aa57-fd84e04747d0",
      "playerCount": 4,
      "startTime": "2026-05-03T14:01:11.774Z",
      "createdAt": "2026-05-03T14:01:11.774Z",
      "initialState": {
        "balance": null
      },
      "rng": {
        "algorithm": "sha256 deterministic shuffle",
        "serverSeedHash": "51ec283182f7273e1a7e371030fff8ae560275d2fa1bd48a3337a364eacc0a26",
        "clientSeed": "client-0d4ee13d",
        "nonce": 0,
        "deckCommitment": "1f85ef14ee732cf624899e323f526a771ebd611d1d756a93b20cefd14b6dffc4",
        "dealtHands": [
          [
            "JS",
            "JH"
          ],
          [
            "KS",
            "8S"
          ],
          [
            "7S",
            "QH"
          ],
          [
            "QS",
            "4S"
          ]
        ]
      },
      "actions": [
        {
          "type": "hand_start",
          "playerCount": 4,
          "extremeCaseId": null,
          "timestamp": "2026-05-03T14:01:11.775Z"
        },
        {
          "type": "odds_computed",
          "phase": "pre",
          "totalBoards": 1086008,
          "timestamp": "2026-05-03T14:01:13.861Z"
        },
        {
          "type": "street_reveal",
          "phase": "flop",
          "boardLength": 3,
          "timestamp": "2026-05-03T14:01:16.542Z"
        },
        {
          "type": "odds_computed",
          "phase": "flop",
          "totalBoards": 820,
          "timestamp": "2026-05-03T14:01:16.596Z"
        },
        {
          "type": "street_reveal",
          "phase": "turn",
          "boardLength": 4,
          "timestamp": "2026-05-03T14:01:20.349Z"
        },
        {
          "type": "odds_computed",
          "phase": "turn",
          "totalBoards": 40,
          "timestamp": "2026-05-03T14:01:20.386Z"
        },
        {
          "type": "street_reveal",
          "phase": "river",
          "boardLength": 5,
          "timestamp": "2026-05-03T14:01:22.676Z"
        }
      ],
      "streets": {
        "flop": [
          {
            "r": 7,
            "s": "D"
          },
          {
            "r": 3,
            "s": "S"
          },
          {
            "r": 14,
            "s": "S"
          }
        ],
        "turn": [
          {
            "r": 7,
            "s": "D"
          },
          {
            "r": 3,
            "s": "S"
          },
          {
            "r": 14,
            "s": "S"
          },
          {
            "r": 11,
            "s": "D"
          }
        ],
        "river": [
          {
            "r": 7,
            "s": "D"
          },
          {
            "r": 3,
            "s": "S"
          },
          {
            "r": 14,
            "s": "S"
          },
          {
            "r": 11,
            "s": "D"
          },
          {
            "r": 5,
            "s": "D"
          }
        ]
      },
      "result": {
        "winnerType": "single",
        "winners": [
          0
        ],
        "normalPaid": 0,
        "totalJackpotPaid": 0,
        "totalPaid": 0,
        "jackpotPayouts": [],
        "handBets": [
          {
            "pre": 0,
            "flop": 0,
            "turn": 0
          },
          {
            "pre": 5,
            "flop": 0,
            "turn": 0
          },
          {
            "pre": 0,
            "flop": 0,
            "turn": 0
          },
          {
            "pre": 0,
            "flop": 0,
            "turn": 0
          }
        ],
        "tieBets": {
          "pre": 0,
          "flop": 0,
          "turn": 0
        },
        "finalBoard": [
          {
            "r": 7,
            "s": "D"
          },
          {
            "r": 3,
            "s": "S"
          },
          {
            "r": 14,
            "s": "S"
          },
          {
            "r": 11,
            "s": "D"
          },
          {
            "r": 5,
            "s": "D"
          }
        ],
        "fairnessRevealedAt": "2026-05-03T14:01:22.705Z",
        "serverSeed": "ec642f9d3049184d6a2fa9431674453a920879b1ed33e2b5f180f39debf14237",
        "serverSeedHash": "51ec283182f7273e1a7e371030fff8ae560275d2fa1bd48a3337a364eacc0a26",
        "clientSeed": "client-0d4ee13d",
        "nonce": 0,
        "deckCommitment": "1f85ef14ee732cf624899e323f526a771ebd611d1d756a93b20cefd14b6dffc4",
        "revealedDeck": [
          "KD",
          "QC",
          "9D",
          "10H",
          "5S",
          "KH",
          "JC",
          "5C",
          "6D",
          "9C",
          "6H",
          "5H",
          "8D",
          "4H",
          "10D",
          "4C",
          "9H",
          "4D",
          "QD",
          "6C",
          "10S",
          "3H",
          "3D",
          "AD",
          "2S",
          "2C",
          "8C",
          "2H",
          "7C",
          "2D",
          "AC",
          "KC",
          "7H",
          "10C",
          "9S",
          "8H",
          "3C",
          "6S",
          "AH",
          "5D",
          "JD",
          "AS",
          "3S",
          "7D",
          "4S",
          "QS",
          "QH",
          "7S",
          "8S",
          "KS",
          "JH",
          "JS"
        ]
      },
      "endTime": "2026-05-03T14:01:22.706Z"
    },
    {
      "handId": "9672e1bd-cef4-4e04-a43d-76f3ad3c337a",
      "gameId": "a7fc1684-9c27-4bf6-a91d-2db62c85f510",
      "playerCount": 4,
      "startTime": "2026-05-03T14:01:24.740Z",
      "createdAt": "2026-05-03T14:01:24.740Z",
      "initialState": {
        "balance": null
      },
      "rng": {
        "algorithm": "sha256 deterministic shuffle",
        "serverSeedHash": "d05e2dd4faec5537135262bf362524f2c50bd8ea0f94f27b05073364533e1133",
        "clientSeed": "client-a7fc1684",
        "nonce": 0,
        "deckCommitment": "12451a8ca2a59ede22b7d4a4b4b9894f1da0a570f0ea37c6c90f4ff0b8e73525",
        "dealtHands": [
          [
            "6D",
            "2C"
          ],
          [
            "KD",
            "JS"
          ],
          [
            "9S",
            "2S"
          ],
          [
            "AH",
            "QD"
          ]
        ]
      },
      "actions": [
        {
          "type": "hand_start",
          "playerCount": 4,
          "extremeCaseId": null,
          "timestamp": "2026-05-03T14:01:24.742Z"
        },
        {
          "type": "odds_computed",
          "phase": "pre",
          "totalBoards": 1086008,
          "timestamp": "2026-05-03T14:01:26.849Z"
        }
      ],
      "streets": {},
      "result": {}
    },
    {
      "handId": "fca88500-2872-4c24-8a60-3d0f3ff53903",
      "gameId": "74b19c18-19ee-4cac-8917-b65f1698ea27",
      "playerCount": 4,
      "startTime": "2026-05-03T14:01:29.580Z",
      "createdAt": "2026-05-03T14:01:29.580Z",
      "initialState": {
        "balance": null
      },
      "rng": {
        "algorithm": "sha256 deterministic shuffle",
        "serverSeedHash": "a62bf0b657284e37d9fccf76d02c8e276d75c1442ac5af98a8d60e5dddbee5fd",
        "clientSeed": "client-74b19c18",
        "nonce": 0,
        "deckCommitment": "9c71efe9b30b5a9c93958661915c624451b935976c2c3c1518cc21dd2c78ac9a",
        "dealtHands": [
          [
            "9H",
            "9D"
          ],
          [
            "AH",
            "QC"
          ],
          [
            "QD",
            "JS"
          ],
          [
            "KH",
            "5C"
          ]
        ]
      },
      "actions": [
        {
          "type": "hand_start",
          "playerCount": 4,
          "extremeCaseId": null,
          "timestamp": "2026-05-03T14:01:29.585Z"
        },
        {
          "type": "odds_computed",
          "phase": "pre",
          "totalBoards": 1086008,
          "timestamp": "2026-05-03T14:01:31.747Z"
        }
      ],
      "streets": {},
      "result": {}
    },
    {
      "handId": "ea67d362-2c18-42d9-98b9-c25764ea7761",
      "gameId": "7295d229-fd2a-4bab-8d4b-3d80806888cf",
      "playerCount": 10,
      "startTime": "2026-05-03T14:01:35.666Z",
      "createdAt": "2026-05-03T14:01:35.666Z",
      "initialState": {
        "balance": null
      },
      "rng": {
        "algorithm": "sha256 deterministic shuffle",
        "serverSeedHash": "c7a0eed42ca62ce34b7c520e9ea97425fa5b5f78908aaf5bac980c610758141a",
        "clientSeed": "client-7295d229",
        "nonce": 0,
        "deckCommitment": "693a7331f214bc71d2f8d7ea4060d75ec5f8cad12085a178117823903e70e870",
        "dealtHands": [
          [
            "8S",
            "4S"
          ],
          [
            "QC",
            "AS"
          ],
          [
            "10C",
            "QH"
          ],
          [
            "6S",
            "AH"
          ],
          [
            "3H",
            "7D"
          ],
          [
            "4H",
            "10H"
          ],
          [
            "10D",
            "8D"
          ],
          [
            "AD",
            "JC"
          ],
          [
            "4C",
            "KS"
          ],
          [
            "3C",
            "8C"
          ]
        ]
      },
      "actions": [
        {
          "type": "hand_start",
          "playerCount": 10,
          "extremeCaseId": null,
          "timestamp": "2026-05-03T14:01:35.668Z"
        },
        {
          "type": "odds_computed",
          "phase": "pre",
          "totalBoards": 201376,
          "timestamp": "2026-05-03T14:01:36.700Z"
        },
        {
          "type": "street_reveal",
          "phase": "flop",
          "boardLength": 3,
          "timestamp": "2026-05-03T14:01:42.241Z"
        },
        {
          "type": "odds_computed",
          "phase": "flop",
          "totalBoards": 406,
          "timestamp": "2026-05-03T14:01:42.295Z"
        },
        {
          "type": "street_reveal",
          "phase": "turn",
          "boardLength": 4,
          "timestamp": "2026-05-03T14:01:43.227Z"
        },
        {
          "type": "odds_computed",
          "phase": "turn",
          "totalBoards": 28,
          "timestamp": "2026-05-03T14:01:43.272Z"
        },
        {
          "type": "street_reveal",
          "phase": "river",
          "boardLength": 5,
          "timestamp": "2026-05-03T14:01:46.170Z"
        }
      ],
      "streets": {
        "flop": [
          {
            "r": 13,
            "s": "C"
          },
          {
            "r": 7,
            "s": "C"
          },
          {
            "r": 5,
            "s": "D"
          }
        ],
        "turn": [
          {
            "r": 13,
            "s": "C"
          },
          {
            "r": 7,
            "s": "C"
          },
          {
            "r": 5,
            "s": "D"
          },
          {
            "r": 9,
            "s": "D"
          }
        ],
        "river": [
          {
            "r": 13,
            "s": "C"
          },
          {
            "r": 7,
            "s": "C"
          },
          {
            "r": 5,
            "s": "D"
          },
          {
            "r": 9,
            "s": "D"
          },
          {
            "r": 3,
            "s": "D"
          }
        ]
      },
      "result": {
        "winnerType": "single",
        "winners": [
          6
        ],
        "normalPaid": 0,
        "totalJackpotPaid": 0,
        "totalPaid": 0,
        "jackpotPayouts": [],
        "handBets": [
          {
            "pre": 0,
            "flop": 0,
            "turn": 0
          },
          {
            "pre": 0,
            "flop": 0,
            "turn": 0
          },
          {
            "pre": 0,
            "flop": 0,
            "turn": 0
          },
          {
            "pre": 0,
            "flop": 0,
            "turn": 0
          },
          {
            "pre": 5,
            "flop": 0,
            "turn": 0
          },
          {
            "pre": 0,
            "flop": 0,
            "turn": 0
          },
          {
            "pre": 0,
            "flop": 0,
            "turn": 0
          },
          {
            "pre": 0,
            "flop": 0,
            "turn": 0
          },
          {
            "pre": 0,
            "flop": 0,
            "turn": 0
          },
          {
            "pre": 0,
            "flop": 0,
            "turn": 0
          }
        ],
        "tieBets": {
          "pre": 0,
          "flop": 0,
          "turn": 0
        },
        "finalBoard": [
          {
            "r": 13,
            "s": "C"
          },
          {
            "r": 7,
            "s": "C"
          },
          {
            "r": 5,
            "s": "D"
          },
          {
            "r": 9,
            "s": "D"
          },
          {
            "r": 3,
            "s": "D"
          }
        ],
        "fairnessRevealedAt": "2026-05-03T14:01:46.221Z",
        "serverSeed": "2a9e3faa2d53c63cd621f60ed6ca3b4db6b0faf9202dd6d234b933b5e5c8f6b7",
        "serverSeedHash": "c7a0eed42ca62ce34b7c520e9ea97425fa5b5f78908aaf5bac980c610758141a",
        "clientSeed": "client-7295d229",
        "nonce": 0,
        "deckCommitment": "693a7331f214bc71d2f8d7ea4060d75ec5f8cad12085a178117823903e70e870",
        "revealedDeck": [
          "3S",
          "7H",
          "6C",
          "4D",
          "KH",
          "QD",
          "5C",
          "JS",
          "9H",
          "5H",
          "JH",
          "KD",
          "10S",
          "7S",
          "6H",
          "5S",
          "2H",
          "2C",
          "2S",
          "2D",
          "6D",
          "QS",
          "9S",
          "8H",
          "JD",
          "AC",
          "9C",
          "3D",
          "9D",
          "5D",
          "7C",
          "KC",
          "8C",
          "3C",
          "KS",
          "4C",
          "JC",
          "AD",
          "8D",
          "10D",
          "10H",
          "4H",
          "7D",
          "3H",
          "AH",
          "6S",
          "QH",
          "10C",
          "AS",
          "QC",
          "4S",
          "8S"
        ]
      },
      "endTime": "2026-05-03T14:01:46.221Z"
    },
    {
      "handId": "b1b82e7d-a8dc-4f7f-a5e5-a69830135b45",
      "gameId": "f6cae608-bdaf-4afe-a241-6b351a2652b5",
      "playerCount": 10,
      "startTime": "2026-05-03T14:01:49.968Z",
      "createdAt": "2026-05-03T14:01:49.968Z",
      "initialState": {
        "balance": null
      },
      "rng": {
        "algorithm": "sha256 deterministic shuffle",
        "serverSeedHash": "0b2daeee9ed40597294d9d866dd1a5413e19986852f0030592f05c4afae49f89",
        "clientSeed": "client-f6cae608",
        "nonce": 0,
        "deckCommitment": "15cdb3bf117eaad942f4f058bde92d1a036c49f7481a03e62dd33750003776ab",
        "dealtHands": [
          [
            "5D",
            "8S"
          ],
          [
            "AD",
            "7H"
          ],
          [
            "9C",
            "8C"
          ],
          [
            "3C",
            "2D"
          ],
          [
            "AS",
            "9D"
          ],
          [
            "JH",
            "10D"
          ],
          [
            "AC",
            "9H"
          ],
          [
            "KH",
            "QD"
          ],
          [
            "7C",
            "8D"
          ],
          [
            "5S",
            "KC"
          ]
        ]
      },
      "actions": [
        {
          "type": "hand_start",
          "playerCount": 10,
          "extremeCaseId": null,
          "timestamp": "2026-05-03T14:01:49.969Z"
        },
        {
          "type": "odds_computed",
          "phase": "pre",
          "totalBoards": 201376,
          "timestamp": "2026-05-03T14:01:51.237Z"
        },
        {
          "type": "street_reveal",
          "phase": "flop",
          "boardLength": 3,
          "timestamp": "2026-05-03T14:01:56.853Z"
        },
        {
          "type": "odds_computed",
          "phase": "flop",
          "totalBoards": 406,
          "timestamp": "2026-05-03T14:01:56.907Z"
        },
        {
          "type": "street_reveal",
          "phase": "turn",
          "boardLength": 4,
          "timestamp": "2026-05-03T14:01:57.787Z"
        },
        {
          "type": "odds_computed",
          "phase": "turn",
          "totalBoards": 28,
          "timestamp": "2026-05-03T14:01:57.829Z"
        },
        {
          "type": "street_reveal",
          "phase": "river",
          "boardLength": 5,
          "timestamp": "2026-05-03T14:02:00.563Z"
        }
      ],
      "streets": {
        "flop": [
          {
            "r": 6,
            "s": "H"
          },
          {
            "r": 13,
            "s": "D"
          },
          {
            "r": 10,
            "s": "C"
          }
        ],
        "turn": [
          {
            "r": 6,
            "s": "H"
          },
          {
            "r": 13,
            "s": "D"
          },
          {
            "r": 10,
            "s": "C"
          },
          {
            "r": 14,
            "s": "H"
          }
        ],
        "river": [
          {
            "r": 6,
            "s": "H"
          },
          {
            "r": 13,
            "s": "D"
          },
          {
            "r": 10,
            "s": "C"
          },
          {
            "r": 14,
            "s": "H"
          },
          {
            "r": 12,
            "s": "S"
          }
        ]
      },
      "result": {
        "winnerType": "single",
        "winners": [
          5
        ],
        "normalPaid": 0,
        "totalJackpotPaid": 0,
        "totalPaid": 0,
        "jackpotPayouts": [],
        "handBets": [
          {
            "pre": 0,
            "flop": 0,
            "turn": 0
          },
          {
            "pre": 0,
            "flop": 0,
            "turn": 0
          },
          {
            "pre": 0,
            "flop": 0,
            "turn": 0
          },
          {
            "pre": 0,
            "flop": 0,
            "turn": 0
          },
          {
            "pre": 0,
            "flop": 0,
            "turn": 0
          },
          {
            "pre": 0,
            "flop": 0,
            "turn": 0
          },
          {
            "pre": 0,
            "flop": 0,
            "turn": 0
          },
          {
            "pre": 0,
            "flop": 0,
            "turn": 0
          },
          {
            "pre": 0,
            "flop": 0,
            "turn": 0
          },
          {
            "pre": 0,
            "flop": 0,
            "turn": 0
          }
        ],
        "tieBets": {
          "pre": 0,
          "flop": 0,
          "turn": 0
        },
        "finalBoard": [
          {
            "r": 6,
            "s": "H"
          },
          {
            "r": 13,
            "s": "D"
          },
          {
            "r": 10,
            "s": "C"
          },
          {
            "r": 14,
            "s": "H"
          },
          {
            "r": 12,
            "s": "S"
          }
        ],
        "fairnessRevealedAt": "2026-05-03T14:02:00.596Z",
        "serverSeed": "677d9731923435aaa62c2fa3dd9fe0af91ba4cc549c99bb185ba997dd1f98511",
        "serverSeedHash": "0b2daeee9ed40597294d9d866dd1a5413e19986852f0030592f05c4afae49f89",
        "clientSeed": "client-f6cae608",
        "nonce": 0,
        "deckCommitment": "15cdb3bf117eaad942f4f058bde92d1a036c49f7481a03e62dd33750003776ab",
        "revealedDeck": [
          "2H",
          "QC",
          "9S",
          "8H",
          "JC",
          "3S",
          "10H",
          "KS",
          "6D",
          "2S",
          "4H",
          "JS",
          "7D",
          "4D",
          "3D",
          "5C",
          "4S",
          "JD",
          "5H",
          "4C",
          "7S",
          "6C",
          "QH",
          "3H",
          "6S",
          "2C",
          "10S",
          "QS",
          "AH",
          "10C",
          "KD",
          "6H",
          "KC",
          "5S",
          "8D",
          "7C",
          "QD",
          "KH",
          "9H",
          "AC",
          "10D",
          "JH",
          "9D",
          "AS",
          "2D",
          "3C",
          "8C",
          "9C",
          "7H",
          "AD",
          "8S",
          "5D"
        ]
      },
      "endTime": "2026-05-03T14:02:00.596Z"
    }
  ]
}