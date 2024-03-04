const axios = require('axios');
const cheerio = require('cheerio');
const util = require('./util');

module.exports = fbDownloader = async (url) => {
  return new Promise((resolve, reject) => {
    const BASE_URL = 'https://fdownloader.net';
    const API_ENDPOINT = 'https://v3.fdownloader.net/api/ajaxSearch';
    //GET TOKEN
    axios({
      url: BASE_URL,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:123.0) Gecko/20100101 Firefox/123.0'
      }
    })
      .then((page) => {
        let $ = cheerio.load(page.data),
          code = $('body > div.container-app > script').text();
        let token = new Function(`${code}; return {k_token, k_exp};`)();

        const params = new URLSearchParams({
          k_exp: token.k_exp,
          k_token: token.k_token,
          q: url,
          lang: 'en',
          web: 'fdownloader.net',
          v: 'v2'
        });
        //GET SCRAPPER DATA
        axios({
          method: 'post',
          url: `${API_ENDPOINT}?lang=en`,
          data: params,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:123.0) Gecko/20100101 Firefox/123.0',
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
          }
        })
          .then((response) => {
            let $ = cheerio.load(response.data.data),
              download = [];
            const thumbnailSrc = $('.thumbnail .image-fb img').attr('src');
            $('#fbdownloader > div.tab-wrap > div:nth-child(5) > table > tbody > tr').each(function (i, elem) {
              let trElement = $(elem);
              let tds = trElement.children();
              let quality = $(tds[0]).text().trim(),
                url = $(tds[2]).children('a').attr('href');
              if (url != undefined) {
                download.push({
                  quality,
                  url
                });
              }
            });
            resolve({
              success: true,
              video_length: util.convertTime($('div.clearfix > p').text().trim()),
              download,
              thumbnail: thumbnailSrc
            });
          })
          .catch((e) => {
            reject({
              success: false,
              error: 'scrapping page error'
            });
          });
      })
      .catch((e) => {
        reject({
          success: false,
          error: 'get token error'
        });
      });
  });
};
