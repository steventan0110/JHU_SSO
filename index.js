const express = require("express");
const passport = require("passport");
const saml = require("passport-saml");
const session = require("express-session");
const bodyParser = require("body-parser");
const fs = require("fs");




const JHU_SSO_URL = "https://idp.jh.edu/idp/profile/SAML2/Redirect/SSO";
// user app's domain asd issuer
const SP_NAME = "glacial-plateau-47269";
// url for the heroku app or any public ip, localhost not allowed
const BASE_URL = "https://glacial-plateau-47269.herokuapp.com";
// local pem file
const PbK = fs.readFileSync(__dirname + "/certs/cert.pem", "utf8");
const PvK = fs.readFileSync(__dirname + "/certs/key.pem", "utf8");
// Setup SAML strategy
const samlStrategy = new saml.Strategy(
    {
        // config options here
        entryPoint: JHU_SSO_URL,
        issuer: SP_NAME,
        callbackUrl: `${BASE_URL}/jhu/login/callback`,
        decryptionPvk: PvK,
        privateCert: PvK,
    },
    (profile, done) => {
        // application specific permission can be done here
        return done(null, profile);
    }
);

// Tell passport to use the samlStrategy
passport.use("samlStrategy", samlStrategy);

// Serialize and deserialize user for paqssport
passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (user, done) {
    done(null, user);
});

// Initialize express.
const app = express();

// Set up port.
const port = process.env.PORT || 7000;

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(
    session({ secret: "use-any-secret",
        resave: false, saveUninitialized: true })
);
app.use(passport.initialize({}));
app.use(passport.session({}));

// Set up homepage route
app.get("/", (req, res) => {
res.send("Test Home Page!");
});

// trust has to be craeted between our SP and JHU auth
app.get("/jhu/metadata", (req, res) => {
    res.type("application/xml");
    res.status(200);
    res.send(samlStrategy.generateServiceProviderMetadata(PbK, PbK));
});

app.get(
    "/jhu/login", (req, res, next) => {
    next();
    },
    passport.authenticate("samlStrategy"),
    (req, res) => {
        res.send(`Welcome ${req.usr.first_name}`);
    }
);

// Start the server.
app.listen(port, () => {
console.log(`Listening on http://localhost:${port}/`);
});
