import React, { useEffect, useState } from 'react';
import './App.css';

function App() {

    return (
        <div className="App">
            <h1>YOUR WEBSITE</h1>
            <h2>Example of an IFRAME embeds to bitbybit.dev preview of scripts</h2>
            <iframe
                title="plane"
                src="https://bitbybit.dev/app/bitbybit/lBERTBnmvOz6Pr1PoKXW/KXvDQrBFqlmCSlxBvmq7/preview"
                frameBorder="0">
            </iframe>
            <iframe
                title="helmet"
                src="https://bitbybit.dev/app/bitbybit/ZggYngpuD5uYq9en9mog/OlHDOEP3MBYSNOuDUdXt/preview"
                frameBorder="0">
            </iframe>
            <p>
                Other content of your website
            </p>
        </div>
    );
}

export default App;
