module.exports = {
    "extends": "airbnb-base",
    "env": {
        "node": true,
        "mocha": true
    },
    "plugins": [
        "promise",
        "chai-friendly",
        "mocha"
    ],
    "rules": {
        "promise/always-return": "error",
        "promise/no-return-wrap": "error",
        "promise/param-names": "error",
        "promise/catch-or-return": "error",
        "promise/no-native": "off",
        "promise/no-nesting": "warn",
        "promise/no-promise-in-callback": "warn",
        "promise/no-callback-in-promise": "warn",
        "promise/avoid-new": "warn",
        "promise/no-return-in-finally": "warn",
        "no-unused-expressions": 0,
        "chai-friendly/no-unused-expressions": 2,
        "mocha/no-exclusive-tests": "error"
    }
};
