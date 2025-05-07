import { useState, useEffect } from 'react';
import { Gift } from 'lucide-react';
import type { Milestone } from '../lib/api';
import { getTopMilestones } from '../lib/api';

const Crowdfunding = () => {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  // PayPal business email from env (add to .env.local)
  const paypalBusinessEmail = 'jaguerx88@gmail.com';
  // IPN listener URL (use your Netlify site domain)
  const ipnUrl = 'https://agendaya.netlify.com/.netlify/functions/ipn-listener';

  useEffect(() => {
    (async () => {
      const { success, data } = await getTopMilestones(10);
      if (success && data) setMilestones(data);
    })();
  }, []);

  return (
    <div className="max-w-4xl mx-4 sm:mx-auto py-8">
      <h1 className="text-3xl font-bold mb-4">Crowdfunding: Nuestra Ruta de Crecimiento</h1>
      <p className="mb-6">Puedes apoyar una ruta con la cantidad que desees.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {milestones.map((m) => (
          <div key={m.id} className="p-4 flex flex-col border rounded-lg shadow">
            <div className="flex items-center mb-2">
              <Gift className="h-6 w-6 text-indigo-600 mr-2" />
              <h2 className="text-xl font-semibold">{m.title}</h2>
            </div>
            <p className="text-sm text-gray-600 mb-2">{m.description}</p>
            <p className="text-sm mb-2">Recaudado: {m.current_amount} / {m.goal_amount} COP</p>
            <p className="font-medium text-indigo-600 mb-4">{m.cta}</p>
            <div className="mt-auto text-center">
              <form
                action="https://www.paypal.com/cgi-bin/webscr"
                method="post"
                target="_blank"
              >
                <input type="hidden" name="cmd" value="_donations" />
                <input type="hidden" name="business" value={paypalBusinessEmail} />
                <input type="hidden" name="item_name" value={m.title} />
                <input type="hidden" name="custom" value={m.id} />
                <input type="hidden" name="notify_url" value={ipnUrl} />
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-500"
                >
                  Donar por PayPal
                </button>
              </form>
            </div>
            <div className="mt-4 text-center">
              <a
                href="https://checkout.wompi.co/l/test_VPOS_vi9OQO"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-500"
              >
                Donar por Wompi
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Crowdfunding; 