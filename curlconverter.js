    const optionsRegex = /((-(d|X|H|b|c|f|F|i|l|k|L|o|O|s|v|w))|(--(requests|request|cookie|cookie-jar|data|fail|form|header|include|head|insecure|location|output|remote-name|silent|verbose|write-out)))\s+('|").*?\6/g;
    const urlRegex = /https?:\/\/[\/\w\.\-\_\%\$\+\!\*\(\)]+/;
    const typeRegex = /(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS|CONNECT|TRACE|FETCH|UPDATE|CREATE|READ|LIST|SEARCH|MODIFY|DELETE|UPLOAD|DOWNLOAD|SUBSCRIBE|UNSUBSCRIBE|PING|NOTIFY|NOTIFYALL|REQUEST|SEND|RECEIVE|AUTHENTICATE|VERIFY|REGISTER|LOG|REPORT|RETRIEVE|CONFIGURE|EVALUATE|EXECUTE)/;
    const typeRegexPlus = /((-X|--request)\s+('?)(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS|CONNECT|TRACE|FETCH|UPDATE|CREATE|READ|LIST|SEARCH|MODIFY|DELETE|UPLOAD|DOWNLOAD|SUBSCRIBE|UNSUBSCRIBE|PING|NOTIFY|NOTIFYALL|REQUEST|SEND|RECEIVE|AUTHENTICATE|VERIFY|REGISTER|LOG|REPORT|RETRIEVE|CONFIGURE|EVALUATE|EXECUTE)('?))/;

    const contentTypeHeader = 'content-type';
    const jsonMimeType = 'application/json';

    const isMatchingOption = (headers, str) => {
    for (let i = 0; i < headers.length; i += 1) {
        if (str.startsWith(headers[i])) {
        return true;
        }
    }
    return false;
    };

    const isAHeaderOption = str => isMatchingOption(['-H ', '--headers ', '--header '], str);
    const isDataOption = str => isMatchingOption(['--data ', '--data-ascii ', '-d ', '--data-raw ', '--data-urlencode ', '--data-binary '], str);

    const removeLeadingTrailingQuotes = (str) => {
    const quotes = ['\'', '"'];
    const newStr = str.trim();
      return quotes.includes(newStr[0]) ? newStr.substr(1, newStr.length - 2) : newStr;
    };

    const subStrFrom = (val, startFromVal) => {
    const dataPosition = val.indexOf(startFromVal);
      return val.substr(dataPosition);
    };

    const getTypeOption = (str) => {
      var type = str.match(typeRegexPlus);
      if(type){
        return type[0];
      }
      return ;
    };

    const isJsonRequest = parsedCommand => (parsedCommand.headers[contentTypeHeader] &&
    parsedCommand.headers[contentTypeHeader].indexOf(jsonMimeType) !== -1);

    const parseBodyByContentType = ({ body, headers }) => {
    //if (body && isJsonRequest(headers)) {
    if (body) {
        try {
        const cleanedBodyData = body.replace('\\"', '"').replace("\\'", "'").replace('\\', '');
        return JSON.parse(cleanedBodyData);
        } catch (ex) {
        // ignore json conversion error..
        console.log('Cannot parse JSON Data ' + ex.message); // eslint-disable-line
        }
    }
    return body;
    };

    const parseOptionValue = (val) => {
    const headerSplit = subStrFrom(val.replaceAll("'","").replaceAll("\"",""), ' ').split(':');
    return {
        key: headerSplit[0].trim(),
        value: headerSplit[1].trim(),
    };
    };

    const parseTypeValue = (val) => {
      return val.match(typeRegex)[0];
    };

    const extractUrl = (val) => {
        var res = val.match(urlRegex);
        if(!res){
            return ;
        }
        return res[0];
    };

    const parseBody = val => removeLeadingTrailingQuotes(subStrFrom(val, ' '));

    const isACurlCommand = val => val.trim().startsWith('curl');
    const isAUrlOption = (val) => {
    const matches = val.match(urlRegex) || [];
    return !!matches.length;
    };

    /*
    * Parse cUrl command to a JSON structure
    * params:
    * command - cUrl command as a string.
    * return JSON object
    */
    function parse(command) {
    if (!command) { return ''; }

    const parsedCommand = {};

    var url = extractUrl(command);
    //alert(url);
    if(!url){
        alert("URL is missing");
        return "";
    }

    var type = getTypeOption(command);

    if (type) {
        parsedCommand.type = parseTypeValue(type);
    }

    parsedCommand.url = url;

    command = command.replace(url,"");
    command = command.replace(type,"");

    // quit if the command does not starts with curl
    if (isACurlCommand(command)) {
        const matches = command.match(optionsRegex);
        if(matches){
            matches.forEach((val) => {
            const option = removeLeadingTrailingQuotes(val);
            if (isAHeaderOption(option)) {
                var { key, value } = parseOptionValue(option);
                parsedCommand.headers = parsedCommand.headers || {};
                parsedCommand.headers[key] = value;
            } else if (isDataOption(option)) {
                parsedCommand.body = parseBody(option);
            } else {
                console.log(`Skipped Header ${val}`); // eslint-disable-line
            }
            });
        } // parse over matches ends

        // should be checked after all the options are analyzed
        // so that we guarentee that we have content-type header
        parsedCommand.body = parseBodyByContentType(parsedCommand);
    }

    return parsedCommand;
    }

    function convertToTrCommand(curl){
        curl = parse(curl);
        if (!curl) { return ''; }

        var output = "call api";

        // add type
        if(curl.type){
            output+=" "+curl.type;
        }

        // add url
        output+=" \""+curl.url+"\"";

        // add headers
        var headers = curl.headers
        var first = true;
        if(headers){
            output+=" with header";
            if(Object.keys(headers).length>1){
                output+="s";
            }
            for(let header in headers){
                var value = headers[header];
                if(!first){
                    output+=" and";
                }
                output+=" \""+header+":"+value+"\""
                first = false;
            }
        }
        
        var body = curl.body
        
        if(body){
            output+=" and body text starting from the next line and ending with [END]\n"+JSON.stringify(body,null,"\t")+"\n[END]";
        }

        return output;
    }


