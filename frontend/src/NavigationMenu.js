import { Link } from 'react-router-dom';

function NavigationMenu() {
    return (
        <nav>
            <ul>
                <li><Link to="/">메인 페이지</Link></li>
                <li><Link to="/emergency">응급실</Link></li>
                <li><Link to="/admin">관리자</Link></li>
                <li><Link to="/useradd">환자정보 입력</Link></li>
                <li><Link to="/userupdate">정보 업데이트</Link></li>
            </ul>
        </nav>
    );
}

export default NavigationMenu;