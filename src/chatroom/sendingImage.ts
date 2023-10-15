import axios from 'axios';

async function sendImage(imageUrl: string): Promise<string | null> {
  try {
    const response = await axios.get(imageUrl, {
      responseType: 'blob',
    });
    const imageBlob = response.data;
    return imageBlob;
  } catch (err) {
    console.error('Error getting image: ', err);
    return null;
  }
}

export { sendImage };
