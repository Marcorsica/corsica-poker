{
  "sessionId": "c40d0a56-4f9d-4c8b-aedb-fcbf56a336a0",
  "startTime": "2026-05-03T13:54:45.506Z",
  "version": "1.0",
  "meta": {
    "app": "Corsica Poker A2",
    "port": 3001
  },
  "hands": [
    {
      "handId": "1985aea9-87ae-4b92-8f4a-b3c8a21fd0eb",
      "gameId": "85729a9e-6301-4468-a01c-21fa896993c1",
      "playerCount": 10,
      "startTime": "2026-05-03T13:55:03.840Z",
      "createdAt": "2026-05-03T13:55:03.840Z",
      "initialState": {
        "balance": null
      },
      "rng": {
        "algorithm": "sha256 deterministic shuffle",
        "serverSeedHash": "75882b7e8bfd70b250262eb855bf720e5e3bbe30560ebbe26b3da985426ec238",
        "clientSeed": "client-85729a9e",
        "nonce": 0,
        "deckCommitment": "3898d8dd16b85192bd994343e7ac7b7ea604d956d04f780b62a710628dc5bbd0",
        "dealtHands": [
          [
            "10S",
            "8H"
          ],
          [
            "8C",
            "7C"
          ],
          [
            "4H",
            "KC"
          ],
          [
            "9H",
            "5C"
          ],
          [
            "KS",
            "JC"
          ],
          [
            "QH",
            "QC"
          ],
          [
            "4D",
            "4S"
          ],
          [
            "7S",
            "QS"
          ],
          [
            "JS",
            "KD"
          ],
          [
            "JD",
            "6S"
          ]
        ]
      },
      "actions": [
        {
          "type": "hand_start",
          "playerCount": 10,
          "extremeCaseId": null,
          "timestamp": "2026-05-03T13:55:03.842Z"
        },
        {
          "type": "odds_computed",
          "phase": "pre",
          "totalBoards": 201376,
          "timestamp": "2026-05-03T13:55:05.124Z"
        },
        {
          "type": "street_reveal",
          "phase": "flop",
          "boardLength": 3,
          "timestamp": "2026-05-03T13:55:14.887Z"
        },
        {
          "type": "odds_computed",
          "phase": "flop",
          "totalBoards": 406,
          "timestamp": "2026-05-03T13:55:14.963Z"
        },
        {
          "type": "street_reveal",
          "phase": "turn",
          "boardLength": 4,
          "timestamp": "2026-05-03T13:55:19.216Z"
        },
        {
          "type": "odds_computed",
          "phase": "turn",
          "totalBoards": 28,
          "timestamp": "2026-05-03T13:55:19.254Z"
        },
        {
          "type": "street_reveal",
          "phase": "river",
          "boardLength": 5,
          "timestamp": "2026-05-03T13:55:22.942Z"
        }
      ],
      "streets": {
        "flop": [
          {
            "r": 9,
            "s": "S"
          },
          {
            "r": 5,
            "s": "D"
          },
          {
            "r": 3,
            "s": "S"
          }
        ],
        "turn": [
          {
            "r": 9,
            "s": "S"
          },
          {
            "r": 5,
            "s": "D"
          },
          {
            "r": 3,
            "s": "S"
          },
          {
            "r": 5,
            "s": "H"
          }
        ],
        "river": [
          {
            "r": 9,
            "s": "S"
          },
          {
            "r": 5,
            "s": "D"
          },
          {
            "r": 3,
            "s": "S"
          },
          {
            "r": 5,
            "s": "H"
          },
          {
            "r": 14,
            "s": "H"
          }
        ]
      },
      "result": {
        "winnerType": "single",
        "winners": [
          3
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
            "r": 9,
            "s": "S"
          },
          {
            "r": 5,
            "s": "D"
          },
          {
            "r": 3,
            "s": "S"
          },
          {
            "r": 5,
            "s": "H"
          },
          {
            "r": 14,
            "s": "H"
          }
        ],
        "fairnessRevealedAt": "2026-05-03T13:55:22.975Z",
        "serverSeed": "9545c895c80edf67dc440e78f36546b8e0c774ec6dcfbb5b3ee3fb5159607f26",
        "serverSeedHash": "75882b7e8bfd70b250262eb855bf720e5e3bbe30560ebbe26b3da985426ec238",
        "clientSeed": "client-85729a9e",
        "nonce": 0,
        "deckCommitment": "3898d8dd16b85192bd994343e7ac7b7ea604d956d04f780b62a710628dc5bbd0",
        "revealedDeck": [
          "QD",
          "7D",
          "9C",
          "6C",
          "2D",
          "8S",
          "AC",
          "AS",
          "AD",
          "KH",
          "5S",
          "10C",
          "3C",
          "3H",
          "2S",
          "2H",
          "10H",
          "6D",
          "10D",
          "3D",
          "9D",
          "6H",
          "JH",
          "7H",
          "2C",
          "8D",
          "4C",
          "AH",
          "5H",
          "3S",
          "5D",
          "9S",
          "6S",
          "JD",
          "KD",
          "JS",
          "QS",
          "7S",
          "4S",
          "4D",
          "QC",
          "QH",
          "JC",
          "KS",
          "5C",
          "9H",
          "KC",
          "4H",
          "7C",
          "8C",
          "8H",
          "10S"
        ]
      },
      "endTime": "2026-05-03T13:55:22.975Z"
    },
    {
      "handId": "69991acb-d5e6-437d-8c11-f4b90fd4cec4",
      "gameId": "242364d8-596d-4bf1-96c5-8b874ee487d7",
      "playerCount": 10,
      "startTime": "2026-05-03T13:55:24.610Z",
      "createdAt": "2026-05-03T13:55:24.610Z",
      "initialState": {
        "balance": null
      },
      "rng": {
        "algorithm": "sha256 deterministic shuffle",
        "serverSeedHash": "9ed46bbf729377373d7a8440181339be8ac2d48539a8303854ea73029a0ef772",
        "clientSeed": "client-242364d8",
        "nonce": 0,
        "deckCommitment": "aa0d93f4e5d2a03eb43ad72310f3302cdceec7d90ab8862abc2a11a5e869fa6a",
        "dealtHands": [
          [
            "9S",
            "6D"
          ],
          [
            "3C",
            "7C"
          ],
          [
            "7S",
            "8H"
          ],
          [
            "AC",
            "10D"
          ],
          [
            "9C",
            "6C"
          ],
          [
            "KD",
            "JS"
          ],
          [
            "KC",
            "7D"
          ],
          [
            "2S",
            "JC"
          ],
          [
            "JH",
            "5D"
          ],
          [
            "2C",
            "4H"
          ]
        ]
      },
      "actions": [
        {
          "type": "hand_start",
          "playerCount": 10,
          "extremeCaseId": null,
          "timestamp": "2026-05-03T13:55:24.611Z"
        },
        {
          "type": "odds_computed",
          "phase": "pre",
          "totalBoards": 201376,
          "timestamp": "2026-05-03T13:55:25.807Z"
        },
        {
          "type": "street_reveal",
          "phase": "flop",
          "boardLength": 3,
          "timestamp": "2026-05-03T13:55:32.409Z"
        },
        {
          "type": "odds_computed",
          "phase": "flop",
          "totalBoards": 406,
          "timestamp": "2026-05-03T13:55:32.451Z"
        },
        {
          "type": "street_reveal",
          "phase": "turn",
          "boardLength": 4,
          "timestamp": "2026-05-03T13:55:34.296Z"
        },
        {
          "type": "odds_computed",
          "phase": "turn",
          "totalBoards": 28,
          "timestamp": "2026-05-03T13:55:34.338Z"
        },
        {
          "type": "street_reveal",
          "phase": "river",
          "boardLength": 5,
          "timestamp": "2026-05-03T13:55:38.177Z"
        }
      ],
      "streets": {
        "flop": [
          {
            "r": 11,
            "s": "D"
          },
          {
            "r": 7,
            "s": "H"
          },
          {
            "r": 6,
            "s": "H"
          }
        ],
        "turn": [
          {
            "r": 11,
            "s": "D"
          },
          {
            "r": 7,
            "s": "H"
          },
          {
            "r": 6,
            "s": "H"
          },
          {
            "r": 12,
            "s": "C"
          }
        ],
        "river": [
          {
            "r": 11,
            "s": "D"
          },
          {
            "r": 7,
            "s": "H"
          },
          {
            "r": 6,
            "s": "H"
          },
          {
            "r": 12,
            "s": "C"
          },
          {
            "r": 5,
            "s": "C"
          }
        ]
      },
      "result": {
        "winnerType": "single",
        "winners": [
          8
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
            "pre": 15,
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
            "r": 11,
            "s": "D"
          },
          {
            "r": 7,
            "s": "H"
          },
          {
            "r": 6,
            "s": "H"
          },
          {
            "r": 12,
            "s": "C"
          },
          {
            "r": 5,
            "s": "C"
          }
        ],
        "fairnessRevealedAt": "2026-05-03T13:55:38.220Z",
        "serverSeed": "7244107f7ad5a6ef75f7b5ffb528f53c2b286f910b8e346c99cb46f0b8ed4d87",
        "serverSeedHash": "9ed46bbf729377373d7a8440181339be8ac2d48539a8303854ea73029a0ef772",
        "clientSeed": "client-242364d8",
        "nonce": 0,
        "deckCommitment": "aa0d93f4e5d2a03eb43ad72310f3302cdceec7d90ab8862abc2a11a5e869fa6a",
        "revealedDeck": [
          "8S",
          "2H",
          "QD",
          "AD",
          "QH",
          "QS",
          "4S",
          "AH",
          "3H",
          "3S",
          "KH",
          "KS",
          "3D",
          "2D",
          "4C",
          "9D",
          "10H",
          "4D",
          "5S",
          "10C",
          "5H",
          "9H",
          "8C",
          "6S",
          "10S",
          "AS",
          "8D",
          "5C",
          "QC",
          "6H",
          "7H",
          "JD",
          "4H",
          "2C",
          "5D",
          "JH",
          "JC",
          "2S",
          "7D",
          "KC",
          "JS",
          "KD",
          "6C",
          "9C",
          "10D",
          "AC",
          "8H",
          "7S",
          "7C",
          "3C",
          "6D",
          "9S"
        ]
      },
      "endTime": "2026-05-03T13:55:38.221Z"
    },
    {
      "handId": "14e81231-14d8-4ece-a932-5b1949ec8d2b",
      "gameId": "d2d8d149-1f93-435b-a8c6-1b8636b237ea",
      "playerCount": 10,
      "startTime": "2026-05-03T13:55:40.071Z",
      "createdAt": "2026-05-03T13:55:40.071Z",
      "initialState": {
        "balance": null
      },
      "rng": {
        "algorithm": "sha256 deterministic shuffle",
        "serverSeedHash": "cdd0469928373a10ddc52b57d52621eec81882b0ea5ac62d6ace3c6af9dc1aa1",
        "clientSeed": "client-d2d8d149",
        "nonce": 0,
        "deckCommitment": "a81ecc9ea103a5e60103022271b402ff7ed87694d46747f2e2302c8827321288",
        "dealtHands": [
          [
            "10C",
            "7S"
          ],
          [
            "4S",
            "JS"
          ],
          [
            "9H",
            "10D"
          ],
          [
            "7C",
            "8D"
          ],
          [
            "3H",
            "7D"
          ],
          [
            "KC",
            "9S"
          ],
          [
            "8S",
            "QC"
          ],
          [
            "6S",
            "10H"
          ],
          [
            "2C",
            "3C"
          ],
          [
            "3S",
            "JC"
          ]
        ]
      },
      "actions": [
        {
          "type": "hand_start",
          "playerCount": 10,
          "extremeCaseId": null,
          "timestamp": "2026-05-03T13:55:40.073Z"
        },
        {
          "type": "odds_computed",
          "phase": "pre",
          "totalBoards": 201376,
          "timestamp": "2026-05-03T13:55:41.208Z"
        },
        {
          "type": "street_reveal",
          "phase": "flop",
          "boardLength": 3,
          "timestamp": "2026-05-03T13:55:44.263Z"
        },
        {
          "type": "odds_computed",
          "phase": "flop",
          "totalBoards": 406,
          "timestamp": "2026-05-03T13:55:44.319Z"
        },
        {
          "type": "street_reveal",
          "phase": "turn",
          "boardLength": 4,
          "timestamp": "2026-05-03T13:55:49.462Z"
        },
        {
          "type": "odds_computed",
          "phase": "turn",
          "totalBoards": 28,
          "timestamp": "2026-05-03T13:55:49.503Z"
        },
        {
          "type": "street_reveal",
          "phase": "river",
          "boardLength": 5,
          "timestamp": "2026-05-03T13:55:52.379Z"
        }
      ],
      "streets": {
        "flop": [
          {
            "r": 5,
            "s": "S"
          },
          {
            "r": 6,
            "s": "C"
          },
          {
            "r": 9,
            "s": "C"
          }
        ],
        "turn": [
          {
            "r": 5,
            "s": "S"
          },
          {
            "r": 6,
            "s": "C"
          },
          {
            "r": 9,
            "s": "C"
          },
          {
            "r": 5,
            "s": "D"
          }
        ],
        "river": [
          {
            "r": 5,
            "s": "S"
          },
          {
            "r": 6,
            "s": "C"
          },
          {
            "r": 9,
            "s": "C"
          },
          {
            "r": 5,
            "s": "D"
          },
          {
            "r": 4,
            "s": "D"
          }
        ]
      },
      "result": {
        "winnerType": "single",
        "winners": [
          3
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
            "r": 5,
            "s": "S"
          },
          {
            "r": 6,
            "s": "C"
          },
          {
            "r": 9,
            "s": "C"
          },
          {
            "r": 5,
            "s": "D"
          },
          {
            "r": 4,
            "s": "D"
          }
        ],
        "fairnessRevealedAt": "2026-05-03T13:55:52.410Z",
        "serverSeed": "97cf06f615e9e5b28c3533a8eb0077af6c133d6da41295312f48d6378867f4ae",
        "serverSeedHash": "cdd0469928373a10ddc52b57d52621eec81882b0ea5ac62d6ace3c6af9dc1aa1",
        "clientSeed": "client-d2d8d149",
        "nonce": 0,
        "deckCommitment": "a81ecc9ea103a5e60103022271b402ff7ed87694d46747f2e2302c8827321288",
        "revealedDeck": [
          "6D",
          "2H",
          "8H",
          "2D",
          "9D",
          "KS",
          "3D",
          "4C",
          "QD",
          "AD",
          "JD",
          "AC",
          "6H",
          "5H",
          "2S",
          "KH",
          "7H",
          "QS",
          "JH",
          "AH",
          "4H",
          "QH",
          "5C",
          "10S",
          "8C",
          "AS",
          "KD",
          "4D",
          "5D",
          "9C",
          "6C",
          "5S",
          "JC",
          "3S",
          "3C",
          "2C",
          "10H",
          "6S",
          "QC",
          "8S",
          "9S",
          "KC",
          "7D",
          "3H",
          "8D",
          "7C",
          "10D",
          "9H",
          "JS",
          "4S",
          "7S",
          "10C"
        ]
      },
      "endTime": "2026-05-03T13:55:52.410Z"
    },
    {
      "handId": "19484326-7f94-4cec-a607-281948f51b76",
      "gameId": "46d1de47-423c-49b9-b236-8455181698c6",
      "playerCount": 10,
      "startTime": "2026-05-03T13:55:54.269Z",
      "createdAt": "2026-05-03T13:55:54.269Z",
      "initialState": {
        "balance": null
      },
      "rng": {
        "algorithm": "sha256 deterministic shuffle",
        "serverSeedHash": "dd1adbbf99b264ae680bd0dad9a0ae246886050e17e738c5c0ff6cd5359e39e6",
        "clientSeed": "client-46d1de47",
        "nonce": 0,
        "deckCommitment": "d3d5fa81abd7bdb711bef9305196c943e489f1f7e92d3f6ef2af936f2bb62451",
        "dealtHands": [
          [
            "10S",
            "8S"
          ],
          [
            "QS",
            "3D"
          ],
          [
            "10D",
            "KS"
          ],
          [
            "JH",
            "AD"
          ],
          [
            "2H",
            "2C"
          ],
          [
            "10C",
            "9C"
          ],
          [
            "7C",
            "8D"
          ],
          [
            "9S",
            "9H"
          ],
          [
            "8C",
            "6D"
          ],
          [
            "KD",
            "4D"
          ]
        ]
      },
      "actions": [
        {
          "type": "hand_start",
          "playerCount": 10,
          "extremeCaseId": null,
          "timestamp": "2026-05-03T13:55:54.271Z"
        },
        {
          "type": "odds_computed",
          "phase": "pre",
          "totalBoards": 201376,
          "timestamp": "2026-05-03T13:55:55.484Z"
        },
        {
          "type": "street_reveal",
          "phase": "flop",
          "boardLength": 3,
          "timestamp": "2026-05-03T13:55:57.589Z"
        },
        {
          "type": "odds_computed",
          "phase": "flop",
          "totalBoards": 406,
          "timestamp": "2026-05-03T13:55:57.633Z"
        },
        {
          "type": "street_reveal",
          "phase": "turn",
          "boardLength": 4,
          "timestamp": "2026-05-03T13:55:58.462Z"
        },
        {
          "type": "odds_computed",
          "phase": "turn",
          "totalBoards": 28,
          "timestamp": "2026-05-03T13:55:58.538Z"
        },
        {
          "type": "street_reveal",
          "phase": "river",
          "boardLength": 5,
          "timestamp": "2026-05-03T13:56:01.370Z"
        }
      ],
      "streets": {
        "flop": [
          {
            "r": 14,
            "s": "H"
          },
          {
            "r": 3,
            "s": "S"
          },
          {
            "r": 7,
            "s": "D"
          }
        ],
        "turn": [
          {
            "r": 14,
            "s": "H"
          },
          {
            "r": 3,
            "s": "S"
          },
          {
            "r": 7,
            "s": "D"
          },
          {
            "r": 4,
            "s": "C"
          }
        ],
        "river": [
          {
            "r": 14,
            "s": "H"
          },
          {
            "r": 3,
            "s": "S"
          },
          {
            "r": 7,
            "s": "D"
          },
          {
            "r": 4,
            "s": "C"
          },
          {
            "r": 4,
            "s": "S"
          }
        ]
      },
      "result": {
        "winnerType": "single",
        "winners": [
          9
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
            "r": 14,
            "s": "H"
          },
          {
            "r": 3,
            "s": "S"
          },
          {
            "r": 7,
            "s": "D"
          },
          {
            "r": 4,
            "s": "C"
          },
          {
            "r": 4,
            "s": "S"
          }
        ],
        "fairnessRevealedAt": "2026-05-03T13:56:01.410Z",
        "serverSeed": "d7a0d8b9a748b83d112a538265a773e21b855a6641ae13ae27d7755ae82a4f7b",
        "serverSeedHash": "dd1adbbf99b264ae680bd0dad9a0ae246886050e17e738c5c0ff6cd5359e39e6",
        "clientSeed": "client-46d1de47",
        "nonce": 0,
        "deckCommitment": "d3d5fa81abd7bdb711bef9305196c943e489f1f7e92d3f6ef2af936f2bb62451",
        "revealedDeck": [
          "4H",
          "QH",
          "6H",
          "JD",
          "9D",
          "3H",
          "2S",
          "5D",
          "JS",
          "5C",
          "5S",
          "KH",
          "QC",
          "8H",
          "7H",
          "7S",
          "10H",
          "3C",
          "6C",
          "QD",
          "JC",
          "KC",
          "AC",
          "AS",
          "6S",
          "2D",
          "5H",
          "4S",
          "4C",
          "7D",
          "3S",
          "AH",
          "4D",
          "KD",
          "6D",
          "8C",
          "9H",
          "9S",
          "8D",
          "7C",
          "9C",
          "10C",
          "2C",
          "2H",
          "AD",
          "JH",
          "KS",
          "10D",
          "3D",
          "QS",
          "8S",
          "10S"
        ]
      },
      "endTime": "2026-05-03T13:56:01.410Z"
    }
  ]
}