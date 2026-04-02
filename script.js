const GEN_RANGES = {
    "1": { min: 1, max: 151 },
    "2": { min: 152, max: 251 },
    "3": { min: 252, max: 386 },
    "4": { min: 387, max: 493 },
    "5": { min: 494, max: 649 },
    "all": { min: 1, max: 649 }
};

const optionsContainer = document.getElementById('options-container');
const playBtn = document.getElementById('play-btn');
const feedback = document.getElementById('feedback');
const message = document.getElementById('message');
const nextBtn = document.getElementById('next-btn');
const genSelect = document.getElementById('gen-select');
const sndSuccess = document.getElementById('snd-success');
const sndError = document.getElementById('snd-error');

let currentTarget = null;
let hasGuessed = false;
let cryAudio = null;

async function getPokemonInfo(id) {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
    const data = await res.json();
    
    const resSpecie = await fetch(data.species.url);
    const dataSpecie = await resSpecie.json();
    const spanishName = dataSpecie.names.find(n => n.language.name === "es").name;

    return { 
        id, 
        name: spanishName, 
        cry: data.cries.latest,
        sprite: data.sprites.front_default // Nueva propiedad de imagen
    };
}

async function startNewRound() {
    hasGuessed = false;
    feedback.classList.add('hidden');
    optionsContainer.innerHTML = '<p style="color:white">Cargando datos...</p>';
    
    const { min, max } = GEN_RANGES[genSelect.value];
    const ids = [];
    while(ids.length < 5) {
        const id = Math.floor(Math.random() * (max - min + 1)) + min;
        if(!ids.includes(id)) ids.push(id);
    }

    try {
        const pokemons = await Promise.all(ids.map(id => getPokemonInfo(id)));
        currentTarget = pokemons[Math.floor(Math.random() * 5)];
        cryAudio = new Audio(currentTarget.cry);
        renderOptions(pokemons);
    } catch (error) {
        optionsContainer.innerHTML = '<p style="color:white">Error al conectar con PokeAPI</p>';
    }
}

function renderOptions(pokemons) {
    optionsContainer.innerHTML = '';
    pokemons.forEach(pkmn => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        
        // Crear imagen
        const img = document.createElement('img');
        img.src = pkmn.sprite;
        img.className = 'pkmn-icon';
        img.alt = pkmn.name;

        // Crear texto del nombre
        const span = document.createElement('span');
        span.innerText = pkmn.name;

        btn.appendChild(img);
        btn.appendChild(span);
        
        btn.onclick = () => handleGuess(pkmn.id, btn);
        optionsContainer.appendChild(btn);
    });
}

function handleGuess(selectedId, btnElement) {
    if (hasGuessed) return;
    hasGuessed = true;

    const allButtons = document.querySelectorAll('.option-btn');
    allButtons.forEach(btn => btn.disabled = true);

    if (selectedId === currentTarget.id) {
        btnElement.classList.add('correct');
        message.innerText = `🎯 ¡Correcto! Es ${currentTarget.name}`;
        sndSuccess.play();
    } else {
        btnElement.classList.add('incorrect');
        message.innerText = `❌ ¡No! Era ${currentTarget.name}`;
        sndError.play();
        
        allButtons.forEach(btn => {
            // Buscamos el botón correcto por el nombre dentro del span
            if(btn.querySelector('span').innerText === currentTarget.name) {
                btn.classList.add('correct');
            }
        });
    }
    feedback.classList.remove('hidden');
}

playBtn.onclick = () => cryAudio?.play();
nextBtn.onclick = startNewRound;
genSelect.onchange = startNewRound;

startNewRound();
