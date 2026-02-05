const { getVideoEmbedUrl } = require('./lib/video.ts');

console.log('Input:', 'https://www.youtube.com/watch?v=x3y07rZ7cvM');
console.log('Embed URL:', getVideoEmbedUrl('https://www.youtube.com/watch?v=x3y07rZ7cvM'));
console.log('Is supported:', !!getVideoEmbedUrl('https://www.youtube.com/watch?v=x3y07rZ7cvM'));
