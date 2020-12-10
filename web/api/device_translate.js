var translate = require('node-google-translate-skidz');

module.exports = {
    exec: function(req, res){
        if(req.query.from_lang && req.query.to_lang && req.query.text){
            translate({
                text: req.query.text,
                source: req.query.from_lang,
                target: req.query.to_lang
            }, function(result) {
                if(result instanceof Error){
                    res.status(500)
                    res.send({error: "Unable to translate"})  
                    return
                }
                var payed = true
                if(!payed){
                    res.status(402)
                    res.send({error: "Your translation use has exceeded your subscription"})
                    return
                }

                res.status(200)
                res.send({translation: result.sentences[0].trans})
                return
            });
        } else {
            res.status(400)
            res.send({error: "Arguments missing"})
            return
        }
    }
}