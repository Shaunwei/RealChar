/**
 * src/pages/Support.jsx
 *
 * created by pycui on 8/18/23
 */

import React from 'react';

const Support = () => {
  return (
    <div className='home'>
      <h1>Get Support for RealChar</h1>

      <p>
        We&apos;re here to help! If you encounter any issues or have questions,
        here&apos;s how you can get support:
      </p>

      <ul>
        <li>
          <strong>Read the README:</strong> Many common questions and
          troubleshooting topics are covered in our{' '}
          <a href='https://github.com/Shaunwei/RealChar/blob/main/README.md'>
            README on GitHub
          </a>
          .
        </li>
        <li>
          <strong>File Issues on GitHub:</strong> If you&apos;ve found a bug or
          want to suggest enhancements, please file an issue in our{' '}
          <a href='https://github.com/Shaunwei/RealChar/issues'>
            GitHub Issues section
          </a>
          .
        </li>
        <li>
          <strong>Ask on Discord:</strong> Join our Discord server to ask
          questions and get real-time assistance from the community.{' '}
          <a href='https://discord.gg/e4AYNnFg2F'>Click here to join</a>.
        </li>
        <li>
          <strong>Contact Support:</strong> If you need direct assistance, you
          can always reach out to us at{' '}
          <a href='mailto:support@realchar.ai'>support@realchar.ai</a>.
        </li>
      </ul>
    </div>
  );
};

export default Support;
