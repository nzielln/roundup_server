import { CLIENT_ID, STATE, CLIENT_SECRET, REDIRECT_URI } from "../server.js";
import querystring from 'querystring'
import axios from "axios";

const getCredentials = (req, res) => {
    console.log("ACCESS REQUESTED!")

    const state = generateRandomString(16)
    res.cookie(STATE, state)

    const scope = [
        "user-read-private",
        "user-read-email",
        "streaming",
        "user-read-playback-state",
        "user-modify-playback-state",
        "user-read-currently-playing",
        "user-read-playback-position",
        "user-top-read"].join(' ')
    
    const params = querystring.stringify({
        response_type: 'code',
        client_id: CLIENT_ID,
        scope: scope,
        redirect_uri: REDIRECT_URI,
        state: state
    })

    res.redirect('https://accounts.spotify.com/authorize?' + params)

}

const callback = (req, res) => {
    console.info("CALLBACK CALLED!")

    const code = req.query.code || null;

    const authOptions = {
        method: 'post',
        url: 'https://accounts.spotify.com/api/token',
        data: querystring.stringify({
            code: code,
            redirect_uri: REDIRECT_URI,
            grant_type: 'authorization_code'
        }),
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + (new Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64'))
        }
    }

    axios(authOptions).then(response => {
        console.log("CALLBACK RESPONSE: ")
        console.info(response.data)
        const { access_token, token_type, refresh_token, expires_in } = response.data

        const options = {
            method: 'get',
            url: 'https://api.spotify.com/v1/me',
            headers: { 'Authorization': `${token_type} ${access_token}` }
        }

        axios(options).then(response => {
            console.log("API.SPOTIFY.COM/V1/ME RESPONSE: ")
            console.log(response.data)

            const params = querystring.stringify({
                access_token, refresh_token, expires_in
            })

            res.redirect(`${process.env.ORIGIN}/home/?${params}`)
        }).catch(error => {
            console.log(error)
        })

    }).catch(error => {
        console.log(error)
        res.redirect(process.env.ORIGIN + '/welcome')
    })

}

const refresh = (req, res) => {
    // requesting access token from refresh token
    console.info("REFRESH REQUESTED!")

    const refresh_token = req.params.refreshToken;

    const authOptions = {
        method: 'post',
        url: 'https://accounts.spotify.com/api/token',
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + (Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64'))
        },
        data: {
            grant_type: 'refresh_token',
            refresh_token: refresh_token
        }
    };


    axios(authOptions).then(response => {
        console.log("RESPONSE RECIEVED")
        console.info(response.data)
        res.send(response.data);
    }).catch(error => {
        console.error(error)
        res.send(error)
    })
}

const generateRandomString = (length) => {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
const SpotifyAuthController = (app) => {
    app.get("/rp/api/login", getCredentials)
    app.get("/rp/api/callback", callback)
    app.get("/rp/api/refresh/:refreshToken", refresh)
}


export default SpotifyAuthController