const queryString = require('query-string');
const axios = require('axios')

function getAuthURL(){
    const stringifiedParams = queryString.stringify({
        client_id: process.env.AUTH_GOOGLE_CLIENT_ID,
        redirect_uri: process.env.AUTH_GOOGLE_REDIRECT,
        scope: [
          'https://www.googleapis.com/auth/userinfo.email',
          'https://www.googleapis.com/auth/userinfo.profile',
        ].join(' '), // space seperated string
        response_type: 'code',
        access_type: 'offline',
        prompt: 'consent',
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${stringifiedParams}`;
}

function authentificate(code, callback){
    axios({
        url: `https://oauth2.googleapis.com/token`,
        method: 'post',
        data: {
          client_id: process.env.AUTH_GOOGLE_CLIENT_ID,
          client_secret: process.env.AUTH_GOOGLE_KEY,
          redirect_uri: process.env.AUTH_GOOGLE_REDIRECT,
          grant_type: 'authorization_code',
          code,
        },
      }).then(function(response){
        axios({
            url: 'https://www.googleapis.com/oauth2/v2/userinfo',
            method: 'get',
            headers: {
                Authorization: `Bearer ${response.data.access_token}`,
            },
        }).then(function(userinfo){
            callback(userinfo)
        }).catch((err) => {
            callback(undefined)
        });
      }).catch((err) => {
          callback(undefined)
      });
      
}

module.exports = {
    authentificate,
    getAuthURL
}