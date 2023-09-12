

var isPhoneExists =  fetch("https://pwsheets.vercel.app/api/getDirectRange?range=A1:I4000&sheetId=1o6zmnshWMuv6e8DocjzYMSHD5uv9qWHt9SFsjs6tFgQ").then(res => res.json()).then(json => {
  
no_in_json = json.find(x => x['Phone no. '] == "8779687009");
console.log(no_in_json);

    return no_in_json['Phone no. '];
}).catch(err => console.log(err));