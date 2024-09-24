import { Button, Frog, TextInput } from 'frog';
import { handle } from 'frog/vercel';
import fetch from 'node-fetch';
import { neynar } from 'frog/middlewares';

const NEYNAR_API_KEY = 'NEYNAR_FROG_FM'; // Replace with your actual Neynar API key
const MASKS_BALANCE_API_URL = 'https://app.masks.wtf/api/balance';

export const app = new Frog({
  assetsPath: '/',
  basePath: '/api',
  title: 'Masks Account Balance',
})

app.use(neynar({ apiKey: NEYNAR_API_KEY, features: [] }));

app.frame('/', async (c) => {
  const { buttonValue, status, inputText } = c;

  if (status === 'initial') {
    return c.res({
      image: (
        <div style={{
          alignItems: 'center',
          background: 'linear-gradient(to right, #432889, #17101F)',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          justifyContent: 'center',
          textAlign: 'center',
          width: '100%',
        }}>
          <div style={{
            color: 'white',
            fontSize: 60,
            fontStyle: 'normal',
            letterSpacing: '-0.025em',
            lineHeight: 1.4,
            padding: '0 120px',
            whiteSpace: 'pre-wrap',
          }}>
            Masks Account Balance
          </div>
        </div>
      ),
      intents: [
        <Button value="fetch_balance">Fetch Account Balance</Button>,
      ],
    });
  }

  if (buttonValue === 'fetch_balance') {
    return c.res({
      image: (
        <div style={{
          alignItems: 'center',
          background: 'linear-gradient(to right, #432889, #17101F)',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          justifyContent: 'center',
          textAlign: 'center',
          width: '100%',
        }}>
          <div style={{
            color: 'white',
            fontSize: 40,
            fontStyle: 'normal',
            letterSpacing: '-0.025em',
            lineHeight: 1.4,
            padding: '0 120px',
            whiteSpace: 'pre-wrap',
          }}>
            Enter Farcaster ID (fid) to fetch balance:
          </div>
        </div>
      ),
      intents: [
        <TextInput placeholder="Enter fid (e.g., 7472)" />,
        <Button value="get_balance">Get Balance</Button>,
        <Button.Reset>Reset</Button.Reset>,
      ],
    });
  }

  if (buttonValue === 'get_balance' && inputText) {
    try {
      const response = await fetch(`${MASKS_BALANCE_API_URL}?fid=${inputText}`);
      const balanceData = await response.json();

      return c.res({
        image: (
          <div style={{
            alignItems: 'center',
            background: 'linear-gradient(to right, #432889, #17101F)',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            justifyContent: 'center',
            textAlign: 'center',
            width: '100%',
          }}>
            <div style={{
              color: 'white',
              fontSize: 40,
              fontStyle: 'normal',
              letterSpacing: '-0.025em',
              lineHeight: 1.4,
              padding: '0 120px',
              whiteSpace: 'pre-wrap',
            }}>
              {`Account Balance for FID ${inputText}:
              MASK: ${balanceData.MASK || 'N/A'}
              ETH: ${balanceData.ETH || 'N/A'}
              WETH: ${balanceData.WETH || 'N/A'}`}
            </div>
          </div>
        ),
        intents: [
          <Button value="fetch_balance">Check Another Balance</Button>,
          <Button.Reset>Reset</Button.Reset>,
        ],
      });
    } catch (error) {
      return c.res({
        image: (
          <div style={{
            alignItems: 'center',
            background: 'linear-gradient(to right, #FF0000, #8B0000)',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            justifyContent: 'center',
            textAlign: 'center',
            width: '100%',
          }}>
            <div style={{
              color: 'white',
              fontSize: 40,
              fontStyle: 'normal',
              letterSpacing: '-0.025em',
              lineHeight: 1.4,
              padding: '0 120px',
              whiteSpace: 'pre-wrap',
            }}>
              Error fetching balance data. Please try again.
            </div>
          </div>
        ),
        intents: [
          <Button value="fetch_balance">Try Again</Button>,
          <Button.Reset>Reset</Button.Reset>,
        ],
      });
    }
  }

  // Default response if no conditions are met
  return c.res({
    image: (
      <div style={{
        alignItems: 'center',
        background: 'linear-gradient(to right, #432889, #17101F)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        justifyContent: 'center',
        textAlign: 'center',
        width: '100%',
      }}>
        <div style={{
          color: 'white',
          fontSize: 60,
          fontStyle: 'normal',
          letterSpacing: '-0.025em',
          lineHeight: 1.4,
          padding: '0 120px',
          whiteSpace: 'pre-wrap',
        }}>
          Unexpected State
        </div>
      </div>
    ),
    intents: [
      <Button.Reset>Reset</Button.Reset>,
    ],
  });
});

export const GET = handle(app);
export const POST = handle(app);