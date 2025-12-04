from flask import Blueprint, render_template, request, redirect, url_for, flash
import uuid
from . import db
from .models import Meeting
from .services import BBBService

main = Blueprint('main', __name__)


# --- ADMIN PANELİ (Sadece Yönetici Görür) ---
@main.route('/')
def dashboard():
    meetings = Meeting.query.order_by(Meeting.created_at.desc()).all()

    # Admin panelinde gösterilecek veriler
    meeting_data = []
    base_url = request.host_url.rstrip('/')  # Örn: http://127.0.0.1:5000

    for m in meetings:
        meeting_data.append({
            "db_obj": m,
            # Admin direkt BBB'ye gider (Moderatör olarak)
            "mod_link": BBBService.get_join_url(m.meeting_id, "Admin", m.moderator_pw),
            # Misafir için bizim sistemimizin "Karşılama Ekranı" linkini oluşturuyoruz
            "guest_invite_link": f"{base_url}/join/{m.meeting_id}"
        })

    return render_template('dashboard.html', meetings=meeting_data)


@main.route('/create', methods=['POST'])
def create():
    name = request.form.get('name')
    # ID ve Şifreleri otomatik üretiyoruz
    meeting_id = str(uuid.uuid4())[:8]
    mod_pw = str(uuid.uuid4())[:6]
    att_pw = str(uuid.uuid4())[:6]

    success, msg = BBBService.create_meeting(name, meeting_id, mod_pw, att_pw)

    if success:
        new_meeting = Meeting(
            meeting_id=meeting_id, name=name, moderator_pw=mod_pw, attendee_pw=att_pw
        )
        db.session.add(new_meeting)
        db.session.commit()
        flash('Toplantı oluşturuldu. Davet linkini paylaşabilirsiniz.', 'success')
    else:
        flash(f'Hata: {msg}', 'danger')

    return redirect(url_for('main.dashboard'))


@main.route('/end/<int:db_id>')
def end_meeting(db_id):
    meeting = Meeting.query.get_or_404(db_id)
    if BBBService.end_meeting(meeting.meeting_id, meeting.moderator_pw):
        meeting.is_active = False
        db.session.commit()
        flash('Toplantı sonlandırıldı.', 'success')
    else:
        flash('Toplantı kapatılamadı.', 'danger')
    return redirect(url_for('main.dashboard'))


# --- MİSAFİR EKRANI (Ayrı Sayfa) ---
@main.route('/join/<meeting_id>', methods=['GET', 'POST'])
def join_screen(meeting_id):
    # 1. Bu ID'ye sahip toplantıyı veritabanında bul
    meeting = Meeting.query.filter_by(meeting_id=meeting_id).first()

    if not meeting or not meeting.is_active:
        return render_template('join_error.html', message="Bu toplantı bulunamadı veya sona erdi.")

    # 2. Form gönderildiyse (Misafir adını yazıp butona bastıysa)
    if request.method == 'POST':
        guest_name = request.form.get('full_name')
        # Arka plandaki şifreyi kullanarak BBB linki üret ve yönlendir
        bbb_url = BBBService.get_join_url(meeting.meeting_id, guest_name, meeting.attendee_pw)
        return redirect(bbb_url)

    # 3. GET isteği ise: İsim sorma ekranını göster
    return render_template('join_screen.html', meeting=meeting)