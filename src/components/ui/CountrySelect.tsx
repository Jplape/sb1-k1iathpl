interface Country {
  value: string;
  label: string;
}

const countriesByContinent: Record<string, Country[]> = {
  Afrique: [
    { value: 'GA', label: 'Gabon' },
    { value: 'CM', label: 'Cameroun' },
    // Ajoutez d'autres pays africains ici
  ],
  Europe: [
    { value: 'FR', label: 'France' },
    // Ajoutez d'autres pays européens ici
  ],
  // Ajoutez d'autres continents
};

export function CountrySelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full rounded-lg border-gray-300 ${props.className || ''}`}
    >
      <option value="">Sélectionnez un pays</option>
      {Object.entries(countriesByContinent).map(([continent, countries]) => (
        <optgroup key={continent} label={continent}>
          {countries.map((country) => (
            <option key={country.value} value={country.value}>
              {country.label}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}