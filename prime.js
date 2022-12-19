const prime = 997;
const primeNumbers = [751, 757, 761, 769];
const typeKeys = ['LANGUAGE', 'MUSIC', 'GEOGRAPHY', 'HISTORY'];
const prefix = 'http://172.16.20.73:21223/qr?key=';
const results = [];
for (let typeidx = 0; typeidx < primeNumbers.length; typeidx++) {
    let seed = primeNumbers[typeidx];
    for (let i = 1; i <= 15; i++) {
        let num = i * seed * prime;
        let sufix = num.toString(16);
        let url = prefix + sufix;
        let key = typeKeys[typeidx];
        results.push({key, url, qnum: i});
    }
}
results