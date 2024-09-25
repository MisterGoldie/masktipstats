import { Button, Frog } from 'frog';
import { handle } from 'frog/vercel';
import fetch from 'node-fetch';
import { neynar } from 'frog/middlewares';

const MASKS_BALANCE_API_URL = 'https://app.masks.wtf/api/balance';
const MASKS_PER_TIP_API_URL = 'https://app.masks.wtf/api/masksPerTip';
const MASKS_RANK_API_URL = 'https://app.masks.wtf/api/rank';
const AIRSTACK_API_KEY = '103ba30da492d4a7e89e7026a6d3a234e';
const AIRSTACK_API_URL = 'https://api.airstack.xyz/gql';

// Tailwind-inspired styles
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: '100%',
    background: 'linear-gradient(to right, #4338ca, #1e1b4b)', // Tailwind indigo-700 to indigo-900
    color: 'white',
    fontFamily: 'Inter, sans-serif',
    padding: '2rem',
  },
  header: {
    fontSize: '2.25rem', // text-4xl
    fontWeight: 'bold',
    marginBottom: '1.5rem',
    textShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  infoContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  infoItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '1.125rem', // text-lg
    padding: '0.5rem',
    borderRadius: '0.375rem', // rounded-md
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // bg-white bg-opacity-10
  },
  label: {
    fontWeight: '500', // font-medium
  },
  value: {
    fontWeight: 'bold',
  },
};

export const app = new Frog({
  basePath: '/api',
  imageOptions: { width: 1200, height: 628 },
  title: '$Masks Token Tracker',
  hub: {
    apiUrl: "https://hubs.airstack.xyz",
    fetchOptions: {
      headers: {
        "x-airstack-hubs": "103ba30da492d4a7e89e7026a6d3a234e",
      }
    }
  }
}).use(
  neynar({
    apiKey: 'NEYNAR_FROG_FM',
    features: ['interactor', 'cast'],
  })
);

async function getFarcasterUserDetails(fid: string) {
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

async function getMasksRank(fid: string): Promise<number> {
  const response = await fetch(`${MASKS_RANK_API_URL}?fid=${fid}`);
  const data = await response.json();
  return data.rank;
}

app.frame('/', async (c) => {
  const { buttonValue } = c;
  const fid = c.frameData?.fid?.toString();

  if (buttonValue === 'get_user_details' && fid) {
    try {
      const userDetails = await getFarcasterUserDetails(fid);
      const balanceResponse = await fetch(`${MASKS_BALANCE_API_URL}?fid=${fid}`);
      const balanceData = await balanceResponse.json();
      const masksPerTip = await getMasksPerTip();
      const masksRank = await getMasksRank(fid);

      return c.res({
        image: (
          <div style={styles.container}>
            <div style={styles.header}>User Details for FID {fid}</div>
            <div style={styles.infoContainer}>
              <div style={styles.infoItem}>
                <span style={styles.label}>Username:</span>
                <span style={styles.value}>{userDetails.userId || 'Unknown'}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.label}>Followers:</span>
                <span style={styles.value}>{userDetails.followerCount}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.label}>Following:</span>
                <span style={styles.value}>{userDetails.followingCount}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.label}>MASK Balance:</span>
                <span style={styles.value}>{balanceData.MASK || 'N/A'}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.label}>$MASKS per tip:</span>
                <span style={styles.value}>{masksPerTip}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.label}>$MASKS Rank:</span>
                <span style={styles.value}>{masksRank}</span>
              </div>
            </div>
          </div>
        ),
        intents: [
          <Button value="refresh">Refresh</Button>,
        ],
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
      return c.res({
        image: (
          <div style={{ ...styles.container, background: 'linear-gradient(to right, #dc2626, #7f1d1d)' }}>
            <div style={styles.header}>Error fetching user data</div>
            <div style={{ ...styles.infoItem, justifyContent: 'center' }}>Please try again</div>
          </div>
        ),
        intents: [
          <Button value="get_user_details">Try Again</Button>,
        ],
      });
    }
  }

  return c.res({
    image: (
      <div style={styles.container}>
        <div style={{ ...styles.header, textAlign: 'center', marginBottom: '2rem' }}>Masks Tipping Frame</div>
        <div style={{ ...styles.infoItem, justifyContent: 'center', fontSize: '1.5rem' }}>Click to fetch your details</div>
      </div>
    ),
    intents: [<Button value="get_user_details">Check $MASKS</Button>],
  });
});

export const GET = handle(app);
export const POST = handle(app);