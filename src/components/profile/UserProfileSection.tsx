import React, { type FormEvent, type ChangeEvent } from 'react';

interface UserProfileSectionProps {
  profileData: {
    full_name: string;
    email: string;
    phone: string;
    avatar_url: string;
  };
  saving: boolean;
  message: { text: string; type: 'success' | 'error' } | null;
  onSave: (e: FormEvent<HTMLFormElement>) => Promise<void>;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

const UserProfileSection: React.FC<UserProfileSectionProps> = ({
  profileData,
  saving,
  message,
  onSave,
  onChange
}) => {
  return (
    <>
      <div className="mt-2">
      <div className="dark:bg-opacity-10 bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          {message && (
            <div className={`mb-4 p-4 rounded ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={onSave}>
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 dark:text-white">
                  Nombre completo
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="full_name"
                    id="full_name"
                    value={profileData.full_name}
                    onChange={onChange}
                    className="shadow-sm dark:bg-opacity-10 p-2 focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300"
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-white">
                  Correo electrónico
                </label>
                <div className="mt-1">
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={profileData.email}
                    disabled
                    className="shadow-sm dark:bg-opacity-10 p-2 bg-gray-50 block w-full sm:text-sm border-gray-300"
                  />
                  <p className="mt-1 dark:text-white text-xs text-gray-500">El correo no se puede modificar</p>
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-white">
                  Teléfono
                </label>
                <div className="mt-1">
                  <input
                    type="tel"
                    name="phone"
                    id="phone"
                    value={profileData.phone}
                    onChange={onChange}
                    className="shadow-sm dark:bg-opacity-10 p-2 focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300"
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="avatar_url" className="block text-sm font-medium text-gray-700 dark:text-white">
                  URL de avatar
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="avatar_url"
                    id="avatar_url"
                    value={profileData.avatar_url}
                    onChange={onChange}
                    className="shadow-sm dark:bg-opacity-10 p-2 focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </div>
      </div>
      </div>
    </>
  );
};

export default UserProfileSection; 