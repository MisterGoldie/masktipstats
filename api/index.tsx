/** @jsxImportSource frog/jsx */

import { Button, Frog } from 'frog';
import { handle } from 'frog/vercel';
import fetch from 'node-fetch';
import { neynar } from 'frog/middlewares';
import fs from 'fs';
import path from 'path';

const MASKS_BALANCE_API_URL = 'https://app.masks.wtf/api/balance';
const MASKS_PER_TIP_API_URL = 'https://app.masks.wtf/api/masksPerTip';
const AIRSTACK_API_KEY = '103ba30da492d4a7e89e7026a6d3a234e';
const AIRSTACK_API_URL = 'https://api.airstack.xyz/gql';
const BACKGROUND_IMAGE_URL = 'https://bafybeiajbch2tb6veul2ydzqmzc62arz5vtpbycei3fcyehase5amv62we.ipfs.w3s.link/Frame%2059%20(5).png';

// Read and encode the TTF file
const fontPath = path.join(process.cwd(), 'public', 'fonts', 'Chalkduster.ttf');
const fontBase64 = fs.readFileSync(fontPath, { encoding: 'base64' });

// Create a CSS rule for the font
const fontFace = `
  @font-face {
    font-family: 'Chalkduster';
    src: url(data:font/truetype;charset=utf-8;base64,${fontBase64}) format('truetype');
    font-weight: normal;
    font-style: normal;
  }
`;

export const app = new Frog({
  basePath: '/api',
  imageOptions: { width: 1200, height: 628 },
  title: '$Masks Token Tracker',
})
.use(
  neynar({
    apiKey: 'NEYNAR_FROG_FM',
    features: ['interactor', 'cast'],
  })
);

interface ConnectedAddress {
  address: string;
  blockchain: string;
}

interface UserDetails {
  dappName: string;
  profileName: string;
  userId: string;
  followerCount: number;
  followingCount: number;
  connectedAddresses: ConnectedAddress[];
}

async function getFarcasterUserDetails(fid: string): Promise<UserDetails> {
  const query = `
    query GetUserConnectedWalletAddress {
      Socials(
        input: {filter: {dappName: {_eq: farcaster}, userId: {_eq: "${fid}"}}, blockchain: ethereum}
      ) {
        Social {
          dappName
          profileName
          userId
          followerCount
          followingCount
          connectedAddresses {
            address
            blockchain
          }
        }
      }
    }
  `;

  const response = await fetch(AIRSTACK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': AIRSTACK_API_KEY,
    },
    body: JSON.stringify({ query }),
  });

  const data = await response.json();
  return data.data.Socials.Social[0];
}

async function getMasksBalance(address: string): Promise<string> {
  const response = await fetch(`${MASKS_BALANCE_API_URL}?address=${address}`);
  const data = await response.json();
  return data.MASK || 'N/A';
}

async function getMasksPerTip(): Promise<number> {
  const response = await fetch(MASKS_PER_TIP_API_URL);
  const data = await response.json();
  return data.masksPerTip;
}

app.frame('/', (c) => {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>$MASKS Token Tracker</title>
      <meta property="fc:frame" content="vNext">
      <meta property="fc:frame:image" content="${BACKGROUND_IMAGE_URL}">
      <meta property="fc:frame:button:1" content="Check $MASKS stats">
      <meta property="fc:frame:post_url" content="${c.url}">
    </head>
    <body>
      <h1>$MASKS Token Tracker. Check your $MASKS balance.</h1>
    </body>
    </html>
  `;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html' },
  });
});

app.frame('/', async (c) => {
  const { buttonValue, frameData } = c;
  
  if (buttonValue !== 'Check $MASKS stats') {
    return c.res({
      image: (
        <div style={{
          backgroundImage: `url(${BACKGROUND_IMAGE_URL})`,
          width: '1200px',
          height: '628px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          color: 'white',
          fontSize: '40px',
          fontWeight: 'bold',
          textAlign: 'center',
          fontFamily: 'Chalkduster, Arial, sans-serif',
        }}>
          <style>{fontFace}</style>
          <div>Welcome to $MASKS Token Tracker</div>
        </div>
      ),
      intents: [
        <Button value="Check $MASKS stats">Check $MASKS stats</Button>
      ],
    });
  }

  const fid = frameData?.fid?.toString();
  const { displayName } = c.var.interactor || {};

  if (!fid) {
    return c.res({
      image: (
        <div style={{
          backgroundImage: `url(${BACKGROUND_IMAGE_URL})`,
          width: '1200px',
          height: '628px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          color: 'white',
          fontSize: '40px',
          fontWeight: 'bold',
          textAlign: 'center',
          fontFamily: 'Chalkduster, Arial, sans-serif',
        }}>
          <style>{fontFace}</style>
          <div>Unable to retrieve user information: No FID provided</div>
        </div>
      ),
      intents: [
        <Button value="Check $MASKS stats">Try Again</Button>
      ],
    });
  }

  try {
    const userDetails = await getFarcasterUserDetails(fid);
    const userAddress = userDetails.connectedAddresses?.find((addr: ConnectedAddress) => addr.blockchain === 'ethereum')?.address || 'N/A';
    const masksBalance = userAddress !== 'N/A' ? await getMasksBalance(userAddress) : 'N/A';
    const masksPerTip = await getMasksPerTip();

    return c.res({
      image: (
        <div style={{
          backgroundImage: `url(${BACKGROUND_IMAGE_URL})`,
          width: '1200px',
          height: '628px',
          display: 'flex',
          flexDirection: 'column',
          padding: '20px',
          color: 'white',
          fontWeight: 'bold',
          fontFamily: 'Chalkduster, Arial, sans-serif',
        }}>
          <style>{fontFace}</style>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
            <div style={{display: 'flex', flexDirection: 'column'}}>
              <span style={{fontSize: '80px'}}>@{userDetails.profileName || displayName || 'Unknown'}</span>
              <span style={{fontSize: '30px'}}>FID: {fid}</span>
            </div>
          </div>
          
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginTop: '20px', fontSize: '38px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '10px'}}>
              <span>Wallet:</span>
              <span style={{fontWeight: '900', minWidth: '200px', textAlign: 'right'}}>{userAddress}</span>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '10px'}}>
              <span>Followers:</span>
              <span style={{fontWeight: '900', minWidth: '200px', textAlign: 'right'}}>{userDetails.followerCount}</span>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '10px'}}>
              <span>Following:</span>
              <span style={{fontWeight: '900', minWidth: '200px', textAlign: 'right'}}>{userDetails.followingCount}</span>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '10px'}}>
              <span>MASK Balance:</span>
              <span style={{fontWeight: '900', minWidth: '200px', textAlign: 'right'}}>{masksBalance}</span>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '10px'}}>
              <span>$MASKS per tip:</span>
              <span style={{fontWeight: '900', minWidth: '200px', textAlign: 'right'}}>{masksPerTip}</span>
            </div>
          </div>
        </div>
      ),
      intents: [
        <Button value="Check $MASKS stats">Refresh</Button>
      ],
    });
  } catch (error) {
    console.error('Error fetching data:', error);
    return c.res({
      image: (
        <div style={{
          backgroundImage: `url(${BACKGROUND_IMAGE_URL})`,
          width: '1200px',
          height: '628px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          color: 'white',
          fontSize: '40px',
          fontWeight: 'bold',
          textAlign: 'center',
          fontFamily: 'Chalkduster, Arial, sans-serif',
        }}>
          <style>{fontFace}</style>
          <div>Stats temporarily unavailable. Please try again later.</div>
        </div>
      ),
      intents: [
        <Button value="Check $MASKS stats">Try Again</Button>
      ],
    });
  }
});

export const GET = handle(app);
export const POST = handle(app);