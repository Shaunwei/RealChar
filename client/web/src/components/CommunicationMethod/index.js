import { Button } from '../ui/button';

const CommunicationMethod = ({ commMethod, setCommMethod }) => {
  const communication = ['Text', 'Call'];

  const handleCommMethodChange = value => {
    setCommMethod(value);
  };

  const isUnsupportedBrowser =
    window.navigator.userAgent.indexOf('Edg') !== -1 ||
    window.navigator.userAgent.indexOf('Firefox') !== -1;

  return (
    <>
      <div className='space-y-2'>
        <label>Communication Method</label>
        <div className='grid grid-cols-2 lg:gap-20 gap-5'>
          {communication.map((method, index) => (
            <div key={index}>
              <Button
                disabled={isUnsupportedBrowser && method === 'Call'}
                className='w-full'
                onClick={() => handleCommMethodChange(method)}
                variant={method === commMethod ? 'default' : 'secondary'}
              >
                {method}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default CommunicationMethod;
