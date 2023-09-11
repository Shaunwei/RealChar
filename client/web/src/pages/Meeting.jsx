import React, { useEffect, useState } from 'react';
import { getHostName, getScheme } from '../utils/urlUtils';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';

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

  if (loading) {
    <div>loading</div>;
  }
  return (
    <main className='p-8 mx-auto max-w-7xl w-full'>
      <div>
        {loading ? (
          <h2>Loading...</h2>
        ) : (
          <>
            <div className='flex items-center'>
              <h2 className='mr-2 text-3xl font-bold tracking-tight'>
                Board Meeting Guest Registry
              </h2>
            </div>
            <div className='mt-4'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Board Member</TableHead>
                    <TableHead>Email Address</TableHead>
                    <TableHead>Check-in Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className='font-medium'>{item.name}</TableCell>
                      <TableCell>{item.email}</TableCell>
                      <TableCell> {item['Check-in Time']}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>
    </main>
  );
};

export default Meeting;
