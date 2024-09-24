import { Button, Frog, TextInput } from 'frog';
import { handle } from 'frog/vercel';
import fetch from 'node-fetch';
import { neynar } from 'frog/middlewares';

const NEYNAR_API_KEY = 'NEYNAR_FROG_FM'; // Replace with your actual Neynar API key
const MASKS_BALANCE_API_URL = 'https://app.masks.wtf/api/balance';
const MASKS_PER_TIP_API_URL = 'https://app.masks.wtf/api/masksPerTip';
const AIRSTACK_API_KEY = '103ba30da492d4a7e89e7026a6d3a234e';
const AIRSTACK_API_URL = 'https://api.airstack.xyz/gql';

export const app = new Frog({
  assetsPath: '/',
  basePath: '/api',
  title: 'Masks Tipping Frame',
})

app.use(neynar({ apiKey: NEYNAR_API_KEY, features: [] }));

async function getFarcasterUserDetails(fid: string): Promise<any> {
  const query = `
    query GetFarcasterUserDetails {
      Socials(
        input: {filter: {dappName: {_eq: farcaster}, userId: {_eq: "${fid}"}}, blockchain: ethereum}
      ) {
        Social {
          dappName
          userId
          profileImage
          followerCount
          followingCount
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

async function getMasksPerTip(): Promise<number> {
  const response = await fetch(MASKS_PER_TIP_API_URL);
  const data = await response.json();
  return data.masksPerTip;
}

const StatBox = ({ title, value }: { title: string; value: string | number }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10px', margin: '5px', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '10px', width: '45%' }}>
    <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '5px' }}>{title}</div>
    <div style={{ fontSize: '20px' }}>{value}</div>
  </div>
);

app.frame('/', async (c) => {
  const { buttonValue, status, inputText } = c;

  const baseStyle = {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    background: 'linear-gradient(to right, #432889, #17101F)',
    color: 'white',
    fontFamily: 'Arial, sans-serif',
    padding: '20px',
  };

  if (status === 'initial') {
    return c.res({
      image: (
        <div style={baseStyle}>
          <div style={{ fontSize: 48, fontWeight: 'bold', marginBottom: '20px' }}>Masks Tipping Frame</div>
          <div style={{ fontSize: 24 }}>Click to fetch user details</div>
        </div>
      ),
      intents: [
        <Button value="fetch_user">Fetch User Details</Button>,
      ],
    });
  }

  if (buttonValue === 'fetch_user') {
    return c.res({
      image: (
        <div style={baseStyle}>
          <div style={{ fontSize: 36, fontWeight: 'bold', marginBottom: '20px' }}>Enter Farcaster ID (fid)</div>
          <div style={{ fontSize: 24 }}>to fetch user details</div>
        </div>
      ),
      intents: [
        <TextInput placeholder="Enter fid (e.g., 7472)" />,
        <Button value="get_user_details">Get User Details</Button>,
        <Button.Reset>Reset</Button.Reset>,
      ],
    });
  }

  if (buttonValue === 'get_user_details' && inputText) {
    try {
      const userDetails = await getFarcasterUserDetails(inputText);
      const balanceResponse = await fetch(`${MASKS_BALANCE_API_URL}?fid=${inputText}`);
      const balanceData = await balanceResponse.json();
      const masksPerTip = await getMasksPerTip();

      return c.res({
        image: (
          <div style={{ ...baseStyle, justifyContent: 'flex-start' }}>
            <div style={{ fontSize: 32, fontWeight: 'bold', marginBottom: '20px', textAlign: 'center' }}>User Details for FID {inputText}</div>
            <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', width: '100%' }}>
              <StatBox title="Username" value={userDetails.userId} />
              <StatBox title="Followers" value={userDetails.followerCount} />
              <StatBox title="Following" value={userDetails.followingCount} />
              <StatBox title="$MASKS per tip" value={masksPerTip} />
            </div>
            <div style={{ fontSize: 24, fontWeight: 'bold', marginTop: '20px', marginBottom: '10px', width: '100%', textAlign: 'center' }}>Account Balance:</div>
            <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', width: '100%' }}>
              <StatBox title="MASK" value={balanceData.MASK || 'N/A'} />
              <StatBox title="ETH" value={balanceData.ETH || 'N/A'} />
              <StatBox title="WETH" value={balanceData.WETH || 'N/A'} />
            </div>
          </div>
        ),
        intents: [
          <Button value="tip_user">Tip User</Button>,
          <Button value="fetch_user">Check Another User</Button>,
          <Button.Reset>Reset</Button.Reset>,
        ],
      });
    } catch (error) {
      return c.res({
        image: (
          <div style={baseStyle}>
            <div style={{ fontSize: 36, fontWeight: 'bold', marginBottom: '20px', textAlign: 'center' }}>Error fetching user data</div>
            <div style={{ fontSize: 24, textAlign: 'center' }}>Please try again</div>
          </div>
        ),
        intents: [
          <Button value="fetch_user">Try Again</Button>,
          <Button.Reset>Reset</Button.Reset>,
        ],
      });
    }
  }

  if (buttonValue === 'tip_user') {
    return c.res({
      image: (
        <div style={baseStyle}>
          <div style={{ fontSize: 36, fontWeight: 'bold', marginBottom: '20px', textAlign: 'center' }}>Tipping functionality</div>
          <div style={{ fontSize: 24, textAlign: 'center' }}>not yet implemented</div>
        </div>
      ),
      intents: [
        <Button value="fetch_user">Check Another User</Button>,
        <Button.Reset>Reset</Button.Reset>,
      ],
    });
  }

  // Default response if no conditions are met
  return c.res({
    image: (
      <div style={baseStyle}>
        <div style={{ fontSize: 48, fontWeight: 'bold', marginBottom: '20px', textAlign: 'center' }}>Unexpected State</div>
        <div style={{ fontSize: 24, textAlign: 'center' }}>Please reset and try again</div>
      </div>
    ),
    intents: [
      <Button.Reset>Reset</Button.Reset>,
    ],
  });
});

export const GET = handle(app);
export const POST = handle(app);