import { Link } from 'react-router-dom';

function BotaoLink() {
  return (
    <Link to="/sua-rota">
      <button>
        Clique aqui
      </button>
    </Link>
  );
}

export default BotaoLink