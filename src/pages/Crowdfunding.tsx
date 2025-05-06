import { useState, useEffect } from 'react';
import { Gift } from 'lucide-react';
import type { Milestone } from '../lib/api';
import { getTopMilestones } from '../lib/api';

const Crowdfunding = () => {
  const [milestones, setMilestones] = useState<Milestone[]>([]);

  useEffect(() => {
    (async () => {
      const { success, data } = await getTopMilestones(10);
      if (success && data) setMilestones(data);
    })();
  }, []);

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-4">Crowdfunding: Hitos de la plataforma</h1>
      <p className="mb-6">Puedes apoyar un hito con la cantidad que desees.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {milestones.map((m) => (
          <div key={m.id} className="p-4 border rounded-lg shadow">
            <div className="flex items-center mb-2">
              <Gift className="h-6 w-6 text-indigo-600 mr-2" />
              <h2 className="text-xl font-semibold">{m.title}</h2>
            </div>
            <p className="text-sm text-gray-600 mb-2">{m.description}</p>
            <p className="text-sm mb-2">Recaudado: {m.current_amount} / {m.goal_amount}</p>
            <p className="font-medium text-indigo-600 mb-4">{m.cta}</p>
            <div className="mt-4">
              <a
                href="https://www.paypal.com/donate/?hosted_button_id=P5EECEAC85YTQ"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-500"
              >
                Contribuir
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Crowdfunding; 