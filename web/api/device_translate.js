var translate = require('node-google-translate-skidz');

module.exports = {
    exec: function(req, res){
        if(req.params.device_id && req.query.from_lang && req.query.to_lang && req.query.text){
            translate({
                text: req.query.text,
                source: req.query.from_lang,
                target: req.query.to_lang
            }, function(result) {
                if(result instanceof Error){
                    res.status(509)
                    res.send({})  
                    return
                }

                res.status(200)
                res.send(result.sentences[0].trans)
            });
        } else {
            res.status(400)
            res.send({})
        }
    }
}