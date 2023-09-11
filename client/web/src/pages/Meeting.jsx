import React, { useEffect, useState } from 'react';
import { getHostName, getScheme } from '../utils/urlUtils';

const Meeting = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const scheme = getScheme();
      const url = scheme + '//' + getHostName() + '/guests';

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const jsonData = await response.json();

        // Append local datetime to the new data rows
        const currentDate = new Date();
        const formattedDateTime = currentDate.toLocaleString('en-US', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });

        // Add 'Check-in Time' to the new data rows
        const newData = jsonData.map(newItem => ({
          ...newItem,
          'Check-in Time': formattedDateTime,
        }));

        // Update the state with the new data
        setData(prevData => {
          const mergedData = [...prevData, ...newData];
          const uniqueData = mergedData.filter(
            (item, index, self) =>
              self.findIndex(el => el.name === item.name) === index
          );
          return uniqueData;
        });

        setLoading(false);
      } else {
        console.error('Failed to fetch data');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch data initially when the component mounts
    fetchData();

    // Set up an interval to fetch data every 3 seconds
    const intervalId = setInterval(fetchData, 3000);

    // Clean up the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div>
      <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>
        Board Meeting Guest Registry
      </h1>
      <table style={{ border: '1px solid #000', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #000', padding: '8px' }}>#</th>
            <th style={{ border: '1px solid #000', padding: '8px' }}>
              Board Member
            </th>
            <th style={{ border: '1px solid #000', padding: '8px' }}>
              Email Address
            </th>
            <th style={{ border: '1px solid #000', padding: '8px' }}>
              Check-in Time
            </th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan='4'>Loading...</td>
            </tr>
          ) : (
            data.map((item, index) => (
              <tr key={index} style={{ border: '1px solid #000' }}>
                <td style={{ border: '1px solid #000', padding: '8px' }}>
                  {index + 1}
                </td>
                <td style={{ border: '1px solid #000', padding: '8px' }}>
                  {item.name}
                </td>
                <td style={{ border: '1px solid #000', padding: '8px' }}>
                  {item.email}
                </td>
                <td style={{ border: '1px solid #000', padding: '8px' }}>
                  {item['Check-in Time']}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Meeting;
