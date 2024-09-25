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

// Read and encode the TTF file
const fontPath = path.join(process.cwd(), 'public', 'fonts', 'Chalkduster.ttf');
const fontBase64 = fs.readFileSync(fontPath, { encoding: 'base64' });

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

app.frame('/', async (c) => {
  const fid = c.frameData?.fid?.toString();

  if (fid) {
    try {
      const userDetails = await getFarcasterUserDetails(fid);
      const userAddress = userDetails.connectedAddresses?.find((addr: ConnectedAddress) => addr.blockchain === 'ethereum')?.address || 'N/A';
      const masksBalance = userAddress !== 'N/A' ? await getMasksBalance(userAddress) : 'N/A';
      const masksPerTip = await getMasksPerTip();

      const imageContent = `
        <html>
          <head>
            <style>
              @font-face {
                font-family: 'Chalkduster';
                src: url(data:font/truetype;charset=utf-8;base64,${fontBase64}) format('truetype');
              }
              body {
                font-family: 'Chalkduster';
                background: linear-gradient(to right, #432889, #17101F);
                color: white;
                width: 1200px;
                height: 628px;
                display: flex;
                flex-direction: column;
                justify-content: center;
                padding: 20px;
              }
              h1 { font-size: 32px; margin-bottom: 20px; }
              p { font-size: 24px; margin-bottom: 10px; }
            </style>
          </head>
          <body>
            <h1>User Details for FID ${fid}</h1>
            <p>Username: ${userDetails.profileName || 'Unknown'}</p>
            <p>Wallet: ${userAddress}</p>
            <p>Followers: ${userDetails.followerCount}</p>
            <p>Following: ${userDetails.followingCount}</p>
            <p>MASK Balance: ${masksBalance}</p>
            <p>$MASKS per tip: ${masksPerTip}</p>
          </body>
        </html>
      `;

      return c.res({
        image: imageContent,
        intents: [
          <Button value="refresh">Refresh</Button>,
        ],
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
      return c.res({
        image: `
          <html>
            <head>
              <style>
                @font-face {
                  font-family: 'Chalkduster';
                  src: url(data:font/truetype;charset=utf-8;base64,${fontBase64}) format('truetype');
                }
                body {
                  font-family: 'Chalkduster';
                  background: linear-gradient(to right, #FF0000, #8B0000);
                  color: white;
                  width: 1200px;
                  height: 628px;
                  display: flex;
                  flex-direction: column;
                  justify-content: center;
                  align-items: center;
                  padding: 20px;
                }
                h1 { font-size: 36px; margin-bottom: 20px; }
                p { font-size: 24px; }
              </style>
            </head>
            <body>
              <h1>Error fetching user data</h1>
              <p>Please try again</p>
            </body>
          </html>
        `,
        intents: [
          <Button value="refresh">Try Again</Button>,
        ],
      });
    }
  }

  return c.res({
    image: `
      <html>
        <head>
          <style>
            @font-face {
              font-family: 'Chalkduster';
              src: url(data:font/truetype;charset=utf-8;base64,${fontBase64}) format('truetype');
            }
            body {
              font-family: 'Chalkduster';
              background: linear-gradient(to right, #432889, #17101F);
              color: white;
              width: 1200px;
              height: 628px;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              padding: 20px;
            }
            h1 { font-size: 48px; margin-bottom: 20px; }
            p { font-size: 24px; }
          </style>
        </head>
        <body>
          <h1>Masks Tipping Frame</h1>
          <p>Click to fetch your details</p>
        </body>
      </html>
    `,
    intents: [<Button value="refresh">Check $MASKS</Button>],
  });
});

export const GET = handle(app);
export const POST = handle(app);