import axios from 'axios';

interface ImageResponse {
  signedUrl: string;
  path: string;
}

async function uploadImageApiCall(wallet: string, jwtToken: string): Promise<ImageResponse | null> {
  try {
    const headers = {
      Authorization: jwtToken,
    };
    const imageUploadApi = `${process.env.IMAGEAPI}${wallet}${process.env.IMAGEAPIENDING}`;
    const response = await axios.get(imageUploadApi, { headers });
    const { signedUrl, path } = response.data;
    return { signedUrl, path };
  } catch (err) {
    console.error('Error getting image: ', err);
    return null;
  }
}

async function convertDiscordImgToBuffer(discordImageUrl: string): Promise<Buffer | null> {
  try {
    const response = await axios.get(discordImageUrl, { responseType: 'arraybuffer' });
    const imageBuffer = response.data;
    return imageBuffer;
  } catch (err) {
    console.error('Error converting image to buffer: ', err);
    return null;
  }
}

async function uploadImageSignedUrl(
  wallet: string,
  jwtToken: string,
  discordImageUrl: string,
  contentType: string,
): Promise<string | null> {
  try {
    const { signedUrl, path } = await uploadImageApiCall(wallet, jwtToken);
    const imageBuffer = await convertDiscordImgToBuffer(discordImageUrl);
    await axios.put(signedUrl, imageBuffer, {
      headers: {
        'Content-Type': `${contentType}`,
      },
    });
    return path;
  } catch (err) {
    console.error('Error uploading image to signedUrl: ', err);
    return null;
  }
}

export { uploadImageApiCall, convertDiscordImgToBuffer, uploadImageSignedUrl };
