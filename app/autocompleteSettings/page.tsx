"use client";

import AutocompleteModelSettings from '@/components/languageModels/AutocompleteModelSettings';
import { Helmet } from 'react-helmet';

export default function Page() {
  return (
    <>
      <Helmet><title>LLM Autocomplete Model Settings</title></Helmet>
      <AutocompleteModelSettings />
    </>
  );
}
