export default function HallSchemePanel({
  hallScheme,
  schemeUploading,
  onUpload,
  onDelete,
}) {
  return (
    <section className="admin-card hall-scheme-upload">
      <div>
        <h2>Схема зала</h2>
        <p>
          Загрузите изображение плана зала. Столики будут отображаться поверх схемы.
        </p>

        {hallScheme?.image_url && (
          <p className="hall-scheme-current">
            Текущая схема загружена.
          </p>
        )}
      </div>

      <div className="hall-scheme-actions">
        <label className="btn btn-secondary hall-scheme-upload-btn">
          {schemeUploading ? 'Загрузка...' : 'Загрузить изображение'}
          <input
            type="file"
            accept="image/*"
            onChange={onUpload}
            disabled={schemeUploading}
            hidden
          />
        </label>

        {hallScheme?.image_url && (
          <button
            type="button"
            className="btn btn-danger"
            onClick={onDelete}
            disabled={schemeUploading}
          >
            Удалить схему
          </button>
        )}
      </div>
    </section>
  )
}