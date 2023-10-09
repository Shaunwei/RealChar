const demoMeeting = [
  {
    name: "Alex",
    color_id: 1,
    content: "Good morning, Emma. Thanks for meeting with me today. How are you doing?",
    timestamp: 1695965752196,
  }, {
    name: "Emma",
    color_id: 3,
    content: "Morning, Alex.I’m good, thank you.Ready to dive into our web project details.How about you ?",
    timestamp: 1695965752197,
  }, {
    name: "Alex",
    color_id: 1,
    content: "I’m well, thanks.Let’s get started.Can you give me a brief update on where we currently stand with the web project ?",
    timestamp: 1695965752199,
  }, {
    name: "Emma",
    color_id: 3,
    content: "Certainly.We’ve finished the design phase, and the development team is now working on implementing the features.The homepage, contact page, and the product pages are almost done, but we’re facing a slight delay with the integration of the payment gateway.",
    timestamp: 1695965752299,
  }, {
    name: "Alex",
    color_id: 1,
    content: "I see.Are there any major blockers causing the delay ?",
    timestamp: 1695965752399,
  }, {
    name: "Emma",
    color_id: 3,
    content: "The main challenge is that the payment gateway’s API has changed since we last integrated it in another project.We need to adapt our code to these changes, which is taking a bit longer than expected.However, the team is actively working on it, and I’ve scheduled a meeting with the payment gateway provider for clarification.",
    timestamp: 1695965752499,
  }, {
    name: "Alex",
    color_id: 1,
    content: "Alright.My main concern is our deadline.As you know, the client wants the website to go live in two weeks.Do you think we’ll make it ?",
    timestamp: 1695965752599,
  }, {
    name: "Emma",
    color_id: 3,
    content: "Given the current situation, it will be tight, but I believe if we prioritize the payment gateway integration and postpone some of the less crucial features to post - launch, we should be able to meet the deadline.",
    timestamp: 1695965752699,
  }, {
    name: "Alex",
    color_id: 1,
    content: "I agree.Let’s ensure that the essential features, especially the ones related to user transactions, are up and running.We can roll out additional features as part of phase two post - launch.",
    timestamp: 1695965752799,
  }, {
    name: "Emma",
    color_id: 3,
    content: " Sounds like a plan.I’ll reassign some of our developers to focus primarily on the payment gateway so that we can expedite that process.I’ll also keep the client updated on our progress and our plan to introduce some features post - launch.",
    timestamp: 1695965752899,
  }, {
    name: "Alex",
    color_id: 1,
    content: "Perfect.And please keep me in the loop as well.I want to make sure we deliver a functional product on time while maintaining quality.",
    timestamp: 1695965752999,
  }, {
    name: "Emma",
    color_id: 3,
    content: " Absolutely, Alex.I’ll make sure you get daily updates.And rest assured, even with the tight deadline, we won’t compromise on quality.",
    timestamp: 1695965753399,
  }, {
    name: "Alex",
    color_id: 1,
    content: "Thanks, Emma.I appreciate your dedication and hard work.Let’s touch base again at the end of this week to see where we are.",
    timestamp: 1695965754399,
  }, {
    name: "Emma",
    color_id: 3,
    content: " Will do.Thanks for your understanding and support, Alex.I’m confident we’ll deliver a great product to the client.",
    timestamp: 1695965755399,
  }, {
    name: "Alex",
    color_id: 1,
    content: "I have no doubts.Let’s get to work!",
    timestamp: 1695965762399,
  }
];

export default function Transcript() {
  const transcript = demoMeeting;
  const colors = ['text-blue-300', 'text-purple-300', 'text-green-300', 'text-red-300', 'text-pink-300', 'text-yellow-300', 'text-cyan-300'];
  return (
    <>
    <h2 className="py-1 px-4 bg-real-blue-500/90 text-small md:text-base font-medium sticky top-24">Transcript</h2>
      <div className="grow overflow-y-auto lg:border-x-1 border-real-blue-500/50">
      <div className="h-[90px]"></div>
      <ul className="flex flex-col gap-3 p-4">
        {transcript.map(line => (
          <li key={line.timestamp}>
            <span className={colors[line.color_id]}>{line.name}: {line.content}</span>
          </li>
        ))}
      </ul>
    </div>
    </>
  );
}
