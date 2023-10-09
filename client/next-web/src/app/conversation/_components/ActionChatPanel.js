import {
  Button,
} from '@nextui-org/react';
const demoActions = [
  {
    id: 1,
    detected: "Schedule a meeting with the payment gateway provider for clarification.",
    suggested: ["calender", "meeting"],
  }, {
    id: 2,
    detected: "Reassign some developers to focus primarily on the payment gateway integration.",
    suggested: ["meeting"],
  }, {
    id: 3,
    detected: "Keep the client updated on the project's progress and the plan to introduce some features post-launch.",
    suggested: ["email"],
  }, {
    id: 4,
    detected: "Provide daily updates to Alex on the project's status.",
    suggested: ["calendar"],
  }
];
export default function ActionPanel() {
  const actions = demoActions;
  return (
    <>
      <h2 className="py-1 px-4 bg-real-blue-500/90 text-small md:text-base font-medium sticky top-0 lg:top-24">Highlights and Actions</h2>
      <div className="grow overflow-y-auto lg:border-x-1 border-real-blue-500/50">
        <div className="hidden h-[90px] lg:flex"></div>
        <ul className="flex flex-col gap-2 p-4 text-tiny">
          {actions.map(action => (
            <li key={action.id} className="p-4 bg-white/10 rounded-lg">
              <p className="quote bg-white/10 rounded-md p-2 mb-2"><span>{action.detected}</span></p>
              <div className="flex flex-row gap-3 items-center">
                <span>Do you want: </span>
                <ul className="flex flex-row gap-3">
                  {action.suggested.map((suggestion => (
                    <li key={suggestion}>
                      <Button size="sm" className="bg-real-contrastBlue">{suggestion}</Button>
                    </li>
                  )))}
                </ul>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
