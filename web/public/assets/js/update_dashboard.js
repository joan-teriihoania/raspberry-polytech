var usageOverviewCanvas = document.getElementById("usage-overview-chart")
var languagesChartCanvas = document.getElementById("languages-chart-pie")

if(languagesChartCanvas && usageOverviewCanvas){
    usageOverviewCanvas = usageOverviewCanvas.getContext('2d')
    languagesChartCanvas = languagesChartCanvas.getContext('2d')

    var languagesChart = new Chart(languagesChartCanvas, {
        'type':'doughnut',
        'data':{
            'labels':[],
            'datasets':[
                {
                    'label':'Langues traduites',
                    'backgroundColor':[],
                    'borderColor':[],
                    'data':[]
                }
            ]
        },
        'options':{
            'maintainAspectRatio':false,
            'legend':{
                'display':false
            },
            'title':{}
        }
    })

    var usageOverviewChart = new Chart(usageOverviewCanvas, {
        'type':'line',
        'data':{
            'labels':[],
            'datasets':[{
                'label':'Traductions',
                'fill':true,
                'data':[],
                'backgroundColor':'rgba(78, 115, 223, 0.05)','borderColor':'rgba(78, 115, 223, 1)'}
            ]
        },
        'options':{
            'maintainAspectRatio':false,
            'legend':{
                'display':false
            },
            'title':{},
            'scales':{
                'xAxes':[
                    {
                        'gridLines':{
                            'color':'rgb(234, 236, 244)',
                            'zeroLineColor':'rgb(234, 236, 244)',
                            'drawBorder':false,
                            'drawTicks':false,
                            'borderDash':['2'],
                            'zeroLineBorderDash':['2'],
                            'drawOnChartArea':false
                        },
                        'ticks':{
                            'fontColor':'#858796',
                            'padding':20
                        }
                    }
                ],
                'yAxes':[
                    {
                        'gridLines':{
                            'color':'rgb(234, 236, 244)',
                            'zeroLineColor':'rgb(234, 236, 244)',
                            'drawBorder':false,
                            'drawTicks':false,
                            'borderDash':['2'],
                            'zeroLineBorderDash':['2']
                        },
                        'ticks':{
                            'fontColor':'#858796',
                            'padding':20
                        }
                    }
                ]
            }
        }
    })

    setInterval(function(){
        update_dashboard()
    }, 1000)



    update_dashboard()
    usage_chart_data = [-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1]
    languages_chart_data = {}

    function update_dashboard(){
        $.ajax({
            url: "/api/v1/account/translations?month_ago=12",
            statusCode: {
                200: function(translations) {
                    var data = [0,0,0,0,0,0,0,0,0,0,0,0]
                    var languages = {}
                    for(translation of translations){
                        var date = new Date(Date.parse(translation.translated_at))
                        data[date.getMonth()] += 1
                        if(languages[translation.from_lang] == undefined){languages[translation.from_lang] = 0}
                        if(languages[translation.to_lang] == undefined){languages[translation.to_lang] = 0}
                        languages[translation.from_lang] += 1
                        languages[translation.to_lang] += 1
                    }

                    $('.user-translations-length-month').html(data[new Date().getMonth()])
                    
                    for(var i = 0; i < data.length;i++){
                        if(usage_chart_data[i] != data[i]){
                            set_usage_overview_chart(['Jan','Fev','Mar','Avr','Mai','Juin','Juil','Août', 'Sept', 'Oct', 'Nov', 'Dec'], data)
                            usage_chart_data = data
                            break
                        }
                    }
                    
                    for(const [lang, value] of Object.entries(languages)){
                        if(languages_chart_data[lang] == undefined || languages_chart_data[lang] != languages[lang]){
                            set_languages_chart_pie(languages)
                            languages_chart_data = languages
                            break
                        }
                    }
                    
                    $.ajax({
                        url: "/api/v1/account",
                        statusCode: {
                            200: function(user) {
                                var percentage = 100
                                if(user.quota > 0){
                                    percentage = Math.round(translations.length / user.quota * 100)
                                }
                                $('.user-quota-percentage').html(percentage + "%")
                                $('.user-quota-progressbar').prop('aria-valuenow', percentage)
                                $('.user-quota-progressbar').css('width', percentage + "%")
                            }
                        }
                    });
                }
            }
        });
    }

    function set_languages_chart_pie(data){
        var bgcolors = []
        var bordercolors = []
        var values = []
        var labels = []
        $('#languages-chart-pie-legend').html("")

        for(const [lang, value] of Object.entries(data)){
            if(langCodes[lang] == undefined){continue}
            bgcolors.push(langCodes[lang].color)
            bordercolors.push('#fff')
            values.push(value)
            labels.push(langCodes[lang].name)
            $('#languages-chart-pie-legend').html(
                $('#languages-chart-pie-legend').html() +
                '<span class="mr-2"><i class="fas fa-circle" style="color:'+langCodes[lang].color+'"></i>&nbsp;'+langCodes[lang].name+'</span>'
            )
        }

        languagesChart.data.labels = labels
        languagesChart.data.datasets[0].backgroundColor = bgcolors
        languagesChart.data.datasets[0].borderColor = bordercolors
        languagesChart.data.datasets[0].data = values
        languagesChart.update()
    }

    function set_usage_overview_chart(labels, data){
        usageOverviewChart.data.labels = labels
        usageOverviewChart.data.datasets[0].data = data
        usageOverviewChart.update()
    }
}